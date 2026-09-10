import crypto from "crypto";
import { prisma } from "../config/prisma";
import { hasActiveWorkspace, linkPendingMemberships } from "./workspaceService";
import { validateEmail } from "../utils/emailValidator";

// ——————————————————————————————————————————————
// الدخول الفوري — بلا كلمة مرور وبلا رمز تحقق بالبريد
// ——————————————————————————————————————————————

/**
 * يفتح جلسة فوراً من البريد واسم الشركة، دون إرسال أي رمز تحقق.
 *
 * بريد جديد + اسم شركة ⇐ يُنشئ الحساب مباشرة. بريد حساب قائم ⇐
 * يفتح جلسته مباشرة — فهذا المسار نفسه هو "تسجيل الدخول" الوحيد
 * على المنصة الآن، ولا صفحة دخول منفصلة تستدعيه لاحقاً.
 *
 * تنبيه أمني: هذا المسار لا يثبت ملكية صندوق البريد بأي شكل — من
 * يعرف بريد أحدهم يدخل حسابه بمجرد كتابته. كان رمز البريد إثبات
 * الملكية الوحيد في هذا المسار؛ إزالته هنا تنفيذ لقرار عمل صريح
 * طُلب صراحة، لا سهو تقني — ويستحق مراجعة أمنية قبل أي إطلاق فعلي.
 */
export async function instantAccess(data: { email: string; name?: string }) {
  const email = await validateEmail(data.email);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const providedName = data.name?.trim() || "";

    // بريد جديد بلا اسم شركة بعد: نطلبه قبل إنشاء الحساب
    if (providedName.length < 2) {
      return { needsName: true as const, email };
    }

    user = await prisma.user.create({
      data: {
        name: providedName.slice(0, 100),
        email,
        // لا كلمة مرور في هذا المسار. القيمة عشوائية لا يعرفها أحد —
        // لأن العمود إلزامي، ولئلا تفتح سلسلة فارغة باباً للدخول.
        passwordHash: crypto.randomBytes(32).toString("hex"),
        // لا توثيق بريد منفصل بعد اليوم في هذا المسار
        isVerified: true,
      },
    });
  } else if (!user.isVerified) {
    // حساب قديم لم يوثَّق عبر مسار كلمة المرور: هذا المسار لا يشترط توثيقاً أصلاً
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null, verificationTokenExpiry: null },
    });
  }

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
