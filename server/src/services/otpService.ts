import crypto from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { sendLoginCodeEmail } from "./emailService";
import { hasActiveWorkspace, linkPendingMemberships } from "./workspaceService";
import { validateEmail } from "../utils/emailValidator";

// ——————————————————————————————————————————————
// Constants
// ——————————————————————————————————————————————

/** صلاحية الرمز: 10 دقائق — طويلة بما يكفي لوصول البريد، قصيرة بما يكفي أمنياً */
const CODE_TTL_MS = 10 * 60 * 1000;

/** عدد محاولات الإدخال الخاطئة قبل إبطال الرمز */
const MAX_ATTEMPTS = 5;

/** حد إصدار الرموز: 3 رموز لكل بريد خلال 15 دقيقة */
const MAX_CODES_PER_WINDOW = 3;
const CODE_WINDOW_MS = 15 * 60 * 1000;

/** أقصر مهلة بين طلبَي رمز لنفس البريد — تمنع إغراق صندوق الوارد */
const RESEND_COOLDOWN_MS = 60 * 1000;

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** رمز من 6 أرقام بعشوائية تشفيرية — Math.random غير مقبول هنا */
function generateCode(): string {
  // رفض إعادة المحاولة (rejection sampling) يمنع انحياز باقي القسمة
  const LIMIT = 1_000_000;
  const MAX = Math.floor(0xffffffff / LIMIT) * LIMIT;

  let value: number;
  do {
    value = crypto.randomBytes(4).readUInt32BE(0);
  } while (value >= MAX);

  return String(value % LIMIT).padStart(6, "0");
}

/**
 * بصمة الرمز — HMAC-SHA256 بمفتاح الخادم.
 * ليست دالة كلمة مرور بطيئة عن قصد: مساحة الرمز 6 أرقام فقط، فالبطء
 * لا يحميها. الحماية الحقيقية هي المهلة (10 دقائق) وعدّاد المحاولات
 * (5) وحدّ الإصدار — أما المفتاح السرّي فيمنع اشتقاق الرموز من نسخة
 * مسروقة من قاعدة البيانات وحدها.
 */
const hashCode = (code: string): string =>
  crypto.createHmac("sha256", env.JWT_SECRET).update(code).digest("hex");

/** مقارنة ثابتة الزمن — لا تُسرّب موضع أول اختلاف */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** اسم احتياطي من مقدّمة البريد حين لا يُمرَّر اسم صريح */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._\-+0-9]+/g, " ").trim();
  return cleaned.length >= 3 ? cleaned.slice(0, 100) : "مستخدم جديد";
}

// ——————————————————————————————————————————————
// Request a code
// ——————————————————————————————————————————————

/**
 * يُصدر رمز دخول ويرسله إلى البريد.
 *
 * الاستجابة واحدة سواء كان البريد مسجَّلاً أم لا — كشفُ ذلك في هذه
 * المرحلة يتيح تعداد حسابات المنصة لأي زائر. التمييز يُؤجَّل إلى ما
 * بعد إثبات ملكية البريد (خطوة التحقق).
 */
export async function requestLoginCode(data: {
  email: string;
  name?: string;
}) {
  // نفس تحقّق التسجيل: صيغة صحيحة، لا بريد مؤقّت، ونطاق له سجل MX
  const email = await validateEmail(data.email);
  const now = new Date();

  const recentCodes = await prisma.loginCode.findMany({
    where: { email, createdAt: { gt: new Date(now.getTime() - CODE_WINDOW_MS) } },
    orderBy: { createdAt: "desc" },
  });

  if (recentCodes.length >= MAX_CODES_PER_WINDOW) {
    throw ApiError.rateLimitExceeded(
      "طلبت رموزاً كثيرة خلال وقت قصير. انتظر 15 دقيقة ثم حاول مجدداً."
    );
  }

  const last = recentCodes[0];
  if (last && now.getTime() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (now.getTime() - last.createdAt.getTime())) / 1000
    );
    throw ApiError.rateLimitExceeded(
      `انتظر ${wait} ثانية قبل طلب رمز جديد.`
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  const code = generateCode();

  // إبطال الرموز السابقة: رمز واحد فعّال لكل بريد في أي لحظة، فلا
  // يبقى رمز قديم صالحاً بعد أن يطلب المستخدم بديلاً عنه.
  const [, created] = await prisma.$transaction([
    prisma.loginCode.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: now },
    }),
    prisma.loginCode.create({
      data: {
        email,
        codeHash: hashCode(code),
        name: data.name?.trim() || null,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      },
    }),
  ]);

  const sent = await sendLoginCodeEmail({
    email,
    name: existingUser?.name || data.name?.trim() || null,
    code,
    isNewUser: !existingUser,
  });

  if (!sent) {
    // الرمز أُنشئ ثم فشل إرساله، فلا أحد يعرفه. حذفه يمنع أمرين:
    // بقاءه محسوباً في حدّ الإصدار، وفرضَ مهلة 60 ثانية على المستخدم
    // بسبب رسالة لم تصله أصلاً.
    await prisma.loginCode.delete({ where: { id: created.id } }).catch(() => undefined);

    logger.error(`تعذّر إرسال رمز الدخول إلى ${email}`);
    throw ApiError.internal(
      "تعذّر إرسال رمز الدخول حالياً. يرجى المحاولة بعد قليل."
    );
  }

  return {
    email,
    expiresInSeconds: Math.floor(CODE_TTL_MS / 1000),
    message: "أرسلنا رمز الدخول إلى بريدك الإلكتروني.",
  };
}

// ——————————————————————————————————————————————
// Verify a code
// ——————————————————————————————————————————————

/**
 * يتحقق من الرمز، وينشئ الحساب إن لم يكن موجوداً، ثم يُصدر رموز الجلسة.
 *
 * إن كان البريد جديداً ولم يُمرَّر اسم — لا في طلب الرمز ولا هنا —
 * تُرجع الدالة needsName دون أن تستهلك الرمز، فيُكمل المستخدم الاسم
 * ويعيد الإرسال بنفس الرمز. هذا الكشف عن جِدّة الحساب آمن: لا يصل
 * إليه إلا من أثبت ملكيته لصندوق البريد.
 */
export async function verifyLoginCode(data: {
  email: string;
  code: string;
  name?: string;
}) {
  const email = normalizeEmail(data.email);
  const code = (data.code || "").trim();

  if (!/^\d{6}$/.test(code)) {
    throw ApiError.invalidInput("الرمز يجب أن يكون 6 أرقام.", [
      { field: "code", issue: "رمز غير صالح." },
    ]);
  }

  const record = await prisma.loginCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw ApiError.badRequest(
      "لا يوجد رمز فعّال لهذا البريد. اطلب رمزاً جديداً."
    );
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.loginCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    throw ApiError.badRequest("انتهت صلاحية الرمز. اطلب رمزاً جديداً.");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.loginCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    throw ApiError.badRequest(
      "تجاوزت عدد المحاولات المسموحة. اطلب رمزاً جديداً."
    );
  }

  if (!safeEqual(hashCode(code), record.codeHash)) {
    const updated = await prisma.loginCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    const left = Math.max(MAX_ATTEMPTS - updated.attempts, 0);
    throw ApiError.badRequest(
      left > 0
        ? `الرمز غير صحيح. تبقّت لك ${left} محاولة.`
        : "الرمز غير صحيح وتجاوزت عدد المحاولات. اطلب رمزاً جديداً."
    );
  }

  // ——— الرمز صحيح ———

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const providedName = data.name?.trim() || record.name?.trim() || "";

    // لا اسم بعد: نُبقي الرمز صالحاً ليعود المستخدم بنفسه ومعه اسمه
    if (providedName.length < 2) {
      return { needsName: true as const, email };
    }

    user = await prisma.user.create({
      data: {
        name: providedName.slice(0, 100),
        email,
        // لا كلمة مرور في هذا المسار. القيمة عشوائية لا يعرفها أحد —
        // لأن العمود إلزامي، ولئلا يفتح سلسلةً فارغة باباً للدخول.
        passwordHash: crypto.randomBytes(32).toString("hex"),
        // ملكية البريد أُثبتت بالرمز نفسه، فلا حاجة لتوثيق منفصل
        isVerified: true,
      },
    });
  } else if (!user.isVerified) {
    // حساب قديم لم يوثَّق: الرمز إثبات كافٍ لملكية البريد
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null, verificationTokenExpiry: null },
    });
  }

  await prisma.loginCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  await linkPendingMemberships(user.id, user.email).catch(() => 0);
  const workspaceExists = await hasActiveWorkspace(user.id);

  return {
    needsName: false as const,
    userId: user.id,
    email: user.email,
    name: user.name,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    hasWorkspace: workspaceExists,
  };
}

/**
 * حذف الرموز المنتهية والمستهلكة الأقدم من يوم.
 * يُستدعى من مسار الصيانة — الجدول ينمو مع كل محاولة دخول.
 */
export async function purgeExpiredCodes() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.loginCode.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}
