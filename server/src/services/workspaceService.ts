import crypto from "crypto";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { sendWorkspaceInviteEmail } from "./emailService";

// ——————————————————————————————————————————————
// Constants
// ——————————————————————————————————————————————

/** الأدوار القابلة للدعوة — 'owner' يُمنح للمنشئ فقط ولا يُدعى إليه أحد */
export const INVITABLE_ROLES = ["admin", "member", "viewer"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

/** صلاحية رابط الدعوة: 7 أيام */
const INVITE_TTL_DAYS = 7;

/** حد أقصى للدعوات في الطلب الواحد — حماية من إغراق حصة Brevo المجانية */
const MAX_INVITES_PER_REQUEST = 25;

export interface InvitePayload {
  email: string;
  role: string;
}

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————

/** التخزين والمقارنة يجريان بحروف صغيرة دائماً، فلا يتكرر العضو بسبب حالة الأحرف */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const normalizeRole = (role?: string): InvitableRole => {
  const value = (role || "member").trim().toLowerCase();
  return (INVITABLE_ROLES as readonly string[]).includes(value)
    ? (value as InvitableRole)
    : "member";
};

/** رمز دعوة عشوائي آمن تشفيرياً (256 بت) — لا يُخمَّن ولا يُعدَّد */
const generateInviteToken = (): string => crypto.randomBytes(32).toString("hex");

const inviteExpiryDate = (): Date =>
  new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

/** شكل موحّد لمساحة العمل كما تستهلكها الواجهة */
const toWorkspaceSummary = (
  workspace: { id: string; name: string; industry: string | null; ownerId: string; createdAt: Date },
  role: string
) => ({
  id: workspace.id,
  name: workspace.name,
  industry: workspace.industry,
  ownerId: workspace.ownerId,
  role,
  isOwner: role === "owner",
  createdAt: workspace.createdAt,
});

// ——————————————————————————————————————————————
// Read — عضويات المستخدم
// ——————————————————————————————————————————————

/**
 * كل مساحات العمل التي ينتمي إليها المستخدم بعضوية فعّالة.
 * هذه هي الدالة التي يبني عليها الحارس (guard) قراره، فلا تُرجع
 * العضويات المعلّقة أو المدعوّة.
 */
export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, status: "active" },
    include: { workspace: true },
    orderBy: { invitedAt: "asc" },
  });

  return memberships.map((m) => toWorkspaceSummary(m.workspace, m.role));
}

/**
 * مساحة العمل الافتراضية للمستخدم — أقدم عضوية فعّالة.
 * تُرجع null إن لم يكن عضواً في أي مساحة.
 */
export async function getPrimaryWorkspace(userId: string) {
  const workspaces = await getUserWorkspaces(userId);
  return workspaces[0] ?? null;
}

/** هل يملك المستخدم مساحة عمل؟ — الاستعلام الذي يستدعيه الحارس في كل طلب */
export async function hasActiveWorkspace(userId: string): Promise<boolean> {
  const count = await prisma.workspaceMember.count({
    where: { userId, status: "active" },
  });
  return count > 0;
}

/** أعضاء مساحة عمل — للعرض في لوحة الإعدادات */
export async function getWorkspaceMembers(workspaceId: string, userId: string) {
  await assertMembership(workspaceId, userId);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: [{ status: "asc" }, { invitedAt: "asc" }],
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return members.map((m) => ({
    id: m.id,
    email: m.email,
    role: m.role,
    status: m.status,
    name: m.user?.name ?? null,
    invitedAt: m.invitedAt,
    joinedAt: m.joinedAt,
  }));
}

/** يتحقق أن المستخدم عضو فعّال في المساحة، وإلا رفض الوصول */
async function assertMembership(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
  });

  if (!membership) {
    throw ApiError.accessDenied("ليس لديك صلاحية الوصول إلى مساحة العمل هذه.");
  }

  return membership;
}

// ——————————————————————————————————————————————
// Create — إنشاء مساحة العمل
// ——————————————————————————————————————————————

/**
 * ينشئ مساحة عمل ويُسجّل صاحبها عضواً فعّالاً بدور 'owner'،
 * ثم يُنشئ دعوة لكل بريد مُمرّر ويرسلها عبر Brevo.
 *
 * الإدراج كلّه داخل معاملة واحدة: إمّا تُنشأ المساحة وعضويتها ودعواتها
 * معاً، أو لا يُكتب شيء. إرسال البريد يجري *بعد* نجاح المعاملة، لأن
 * فشل مزوّد البريد لا يجوز أن يُسقط مساحة عمل أُنشئت فعلاً.
 */
export async function createWorkspace(
  userId: string,
  payload: { name: string; industry?: string; invites?: InvitePayload[] }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود.");
  }

  const name = payload.name?.trim();
  if (!name) {
    throw ApiError.invalidInput("اسم مساحة العمل مطلوب.", [
      { field: "name", issue: "اسم الشركة / المشروع مطلوب." },
    ]);
  }

  const ownerEmail = normalizeEmail(user.email);
  const invites = sanitizeInvites(payload.invites ?? [], ownerEmail);

  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name,
        industry: payload.industry?.trim() || null,
        ownerId: user.id,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        email: ownerEmail,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      },
    });

    const created: Array<{ email: string; role: string; token: string }> = [];

    for (const invite of invites) {
      const token = generateInviteToken();

      await tx.workspaceInvite.create({
        data: {
          workspaceId: workspace.id,
          email: invite.email,
          token,
          role: invite.role,
          expiresAt: inviteExpiryDate(),
        },
      });

      // المدعو يظهر في قائمة الأعضاء بحالة 'invited' فور الإنشاء،
      // فيرى صاحب المساحة من دعا حتى قبل أن يقبلوا.
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          email: invite.email,
          role: invite.role,
          status: "invited",
        },
      });

      created.push({ email: invite.email, role: invite.role, token });
    }

    return { workspace, created };
  });

  const invitesSent = await dispatchInvites(
    result.created,
    result.workspace.name,
    user.name
  );

  return {
    workspace: toWorkspaceSummary(result.workspace, "owner"),
    invitesCreated: result.created.length,
    invitesSent,
  };
}

/**
 * ينظّف قائمة الدعوات: يوحّد حالة الأحرف، يُسقط غير الصالح، يزيل
 * التكرار، ويستبعد بريد صاحب المساحة (فهو عضو أصلاً).
 * آخر دور مُمرّر لبريد مكرّر هو الذي يسود.
 */
function sanitizeInvites(
  invites: InvitePayload[],
  ownerEmail: string
): Array<{ email: string; role: InvitableRole }> {
  const byEmail = new Map<string, InvitableRole>();

  for (const invite of invites) {
    const email = normalizeEmail(invite?.email ?? "");
    if (!email || !isValidEmail(email) || email === ownerEmail) continue;
    byEmail.set(email, normalizeRole(invite?.role));
  }

  if (byEmail.size > MAX_INVITES_PER_REQUEST) {
    throw ApiError.invalidInput(
      `لا يمكن دعوة أكثر من ${MAX_INVITES_PER_REQUEST} عضواً في المرّة الواحدة.`,
      [{ field: "invites", issue: `الحد الأقصى ${MAX_INVITES_PER_REQUEST} دعوة.` }]
    );
  }

  return [...byEmail.entries()].map(([email, role]) => ({ email, role }));
}

/**
 * يرسل رسائل الدعوة ويعيد عدد ما نجح منها.
 * الفشل يُسجَّل ولا يُرمى: الدعوة موجودة في قاعدة البيانات ورابطها
 * صالح، وبإمكان صاحب المساحة إعادة الإرسال لاحقاً.
 */
async function dispatchInvites(
  invites: Array<{ email: string; role: string; token: string }>,
  workspaceName: string,
  inviterName: string
): Promise<number> {
  const results = await Promise.all(
    invites.map(async (invite) => {
      try {
        return await sendWorkspaceInviteEmail({
          email: invite.email,
          token: invite.token,
          workspaceName,
          inviterName,
          role: invite.role,
        });
      } catch (error) {
        logger.error(`فشل إرسال دعوة مساحة العمل إلى ${invite.email}:`, error);
        return false;
      }
    })
  );

  return results.filter(Boolean).length;
}

// ——————————————————————————————————————————————
// Invites — دعوة أعضاء إلى مساحة قائمة
// ——————————————————————————————————————————————

/**
 * يدعو أعضاء إلى مساحة عمل موجودة. مقصور على صاحب المساحة والمشرفين.
 * البريد المدعو مسبقاً وما زالت دعوته قائمة تُجدَّد له الدعوة برمز
 * جديد بدل رفض الطلب.
 */
export async function inviteMembers(
  workspaceId: string,
  userId: string,
  invites: InvitePayload[]
) {
  const membership = await assertMembership(workspaceId, userId);

  if (membership.role !== "owner" && membership.role !== "admin") {
    throw ApiError.accessDenied("دعوة الأعضاء متاحة لمالك المساحة والمشرفين فقط.");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, owner: { select: { name: true, email: true } } },
  });

  if (!workspace) {
    throw ApiError.notFound("مساحة العمل غير موجودة.");
  }

  const clean = sanitizeInvites(invites, normalizeEmail(workspace.owner.email));

  if (clean.length === 0) {
    throw ApiError.invalidInput("لم يُمرَّر أي بريد إلكتروني صالح للدعوة.", [
      { field: "invites", issue: "أضف بريداً إلكترونياً واحداً صالحاً على الأقل." },
    ]);
  }

  const created: Array<{ email: string; role: string; token: string }> = [];
  const skipped: string[] = [];

  for (const invite of clean) {
    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_email: { workspaceId, email: invite.email } },
    });

    // العضو الفعّال لا يُدعى مجدداً
    if (existing?.status === "active") {
      skipped.push(invite.email);
      continue;
    }

    const token = generateInviteToken();

    await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: invite.email,
        token,
        role: invite.role,
        expiresAt: inviteExpiryDate(),
      },
    });

    await prisma.workspaceMember.upsert({
      where: { workspaceId_email: { workspaceId, email: invite.email } },
      create: {
        workspaceId,
        email: invite.email,
        role: invite.role,
        status: "invited",
      },
      update: { role: invite.role, status: "invited", invitedAt: new Date() },
    });

    created.push({ email: invite.email, role: invite.role, token });
  }

  const sent = await dispatchInvites(created, workspace.name, workspace.owner.name);

  return { invitesCreated: created.length, invitesSent: sent, skipped };
}

// ——————————————————————————————————————————————
// Invite lookup & acceptance
// ——————————————————————————————————————————————

/**
 * يقرأ دعوة برمزها للعرض قبل تسجيل الدخول (اسم المساحة والدور).
 * لا يكشف أي شيء عن أعضاء المساحة — الرمز وحده لا يمنح وصولاً.
 */
export async function getInviteByToken(token: string) {
  const invite = await findUsableInvite(token);

  return {
    email: invite.email,
    role: invite.role,
    workspaceName: invite.workspace.name,
    expiresAt: invite.expiresAt,
  };
}

/** يجلب دعوة صالحة أو يرمي الخطأ المناسب (غير موجودة / مستهلكة / منتهية) */
async function findUsableInvite(token: string) {
  const clean = (token || "").trim();

  if (!clean) {
    throw ApiError.invalidInput("رمز الدعوة مفقود.");
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token: clean },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!invite) {
    throw ApiError.notFound("رابط الدعوة غير صالح.");
  }

  if (invite.accepted) {
    throw ApiError.badRequest("هذه الدعوة مستخدمة بالفعل.");
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest("انتهت صلاحية رابط الدعوة. اطلب دعوة جديدة من صاحب المساحة.");
  }

  return invite;
}

/**
 * يقبل الدعوة نيابةً عن المستخدم المسجَّل دخوله.
 *
 * الدعوة موجَّهة إلى بريد بعينه، فنشترط تطابق بريد الحساب مع بريد
 * الدعوة: لولا ذلك لأمكن لأي حساب يحصل على الرابط أن ينضم بدلاً من
 * المدعو. العمليات كلّها في معاملة واحدة حتى لا تُستهلك الدعوة دون
 * أن تُنشأ العضوية.
 */
export async function acceptInvite(token: string, userId: string) {
  const invite = await findUsableInvite(token);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود.");
  }

  const userEmail = normalizeEmail(user.email);

  if (userEmail !== normalizeEmail(invite.email)) {
    throw ApiError.accessDenied(
      `هذه الدعوة موجَّهة إلى ${invite.email}. سجّل الدخول بهذا البريد لقبولها.`
    );
  }

  await prisma.$transaction(async (tx) => {
    // التحديث المشروط على accepted=false يجعل الاستهلاك ذرّياً:
    // نقرتان متزامنتان على الرابط لا تُنتجان إلا قبولاً واحداً.
    const consumed = await tx.workspaceInvite.updateMany({
      where: { id: invite.id, accepted: false },
      data: { accepted: true },
    });

    if (consumed.count === 0) {
      throw ApiError.badRequest("هذه الدعوة مستخدمة بالفعل.");
    }

    await tx.workspaceMember.upsert({
      where: {
        workspaceId_email: { workspaceId: invite.workspaceId, email: userEmail },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId: user.id,
        email: userEmail,
        role: invite.role,
        status: "active",
        joinedAt: new Date(),
      },
      update: {
        userId: user.id,
        role: invite.role,
        status: "active",
        joinedAt: new Date(),
      },
    });
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: invite.workspaceId },
  });

  return {
    workspace: workspace ? toWorkspaceSummary(workspace, invite.role) : null,
  };
}

/**
 * يربط الدعوات المعلّقة بحساب جديد بنفس البريد.
 * يُستدعى بعد تسجيل الدخول ليجد المستخدم مساحاته بانتظاره حتى لو
 * أنشأ حسابه من الصفحة الرئيسية بدل رابط الدعوة.
 */
export async function linkPendingMemberships(userId: string, email: string) {
  const normalized = normalizeEmail(email);

  const { count } = await prisma.workspaceMember.updateMany({
    where: { email: normalized, userId: null },
    data: { userId },
  });

  return count;
}
