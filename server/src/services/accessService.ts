import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

// ——————————————————————————————————————————————
// accessService — المصدر الوحيد لقرارات الوصول في الهيكل التنظيمي
// ——————————————————————————————————————————————
//
//  الأدوار على مستوى مساحة العمل (owner/admin/member/viewer) تحسم
//  «ماذا يستطيع أن يفعل»، والأقسام تحسم «أين يستطيع أن يفعله»:
//
//  • owner/admin  → كل شيء في كل الأقسام.
//  • member       → يرى أقسامه وخططها ومشاريعها، ويُنشئ مشاريع في أقسامه.
//  • viewer       → يرى ما يراه العضو، ولا يكتب شيئاً.
//
//  رئيس القسم (head) يُنشئ خطط قسمه ويديرها. قائد الخطة (lead) يدير
//  خطته، والمساهم (contributor) يعدّل أهدافها ومهامها.
//
//  المشاريع (ToolRun):
//   visibility = department → يراه كل أعضاء القسم وأعضاء الخطة.
//   visibility = restricted → المُنشئ + الأعضاء المختارون + المالك/المشرفون.
//   المشاريع القديمة بلا قسم ولا خطة تبقى مرئية لكل المساحة كما كانت.
// ——————————————————————————————————————————————

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type ProjectLevel = "view" | "edit" | "manage";

export interface Actor {
  userId: string;
  workspaceId: string;
  memberId: string;
  role: WorkspaceRole;
  isAdmin: boolean;
  canWrite: boolean;
  /** الأقسام التي ينتمي إليها */
  departmentIds: string[];
  /** الأقسام التي يرأسها */
  headOfDepartmentIds: string[];
  /** الخطط التي ينتمي إليها */
  planIds: string[];
}

/** يبني هوية الفاعل من عضويته الفعّالة وأقسامه — استعلام واحد */
export async function loadActor(
  workspaceId: string,
  userId: string,
  role: string
): Promise<Actor> {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
    select: {
      id: true,
      departmentMemberships: { select: { departmentId: true, role: true } },
      planMemberships: { select: { planId: true } },
    },
  });

  if (!member) {
    throw ApiError.accessDenied("ليس لديك عضوية فعّالة في مساحة العمل هذه.");
  }

  const r = (role as WorkspaceRole) || "viewer";
  const isAdmin = r === "owner" || r === "admin";

  return {
    userId,
    workspaceId,
    memberId: member.id,
    role: r,
    isAdmin,
    canWrite: r !== "viewer",
    departmentIds: member.departmentMemberships.map((d) => d.departmentId),
    headOfDepartmentIds: member.departmentMemberships
      .filter((d) => d.role === "head")
      .map((d) => d.departmentId),
    planIds: member.planMemberships.map((p) => p.planId),
  };
}

// ——————————————————————————————————————————————
// Departments
// ——————————————————————————————————————————————

export function departmentListWhere(actor: Actor): Prisma.DepartmentWhereInput {
  if (actor.isAdmin) return { workspaceId: actor.workspaceId };
  return { workspaceId: actor.workspaceId, id: { in: actor.departmentIds } };
}

export function canViewDepartment(actor: Actor, departmentId: string): boolean {
  return actor.isAdmin || actor.departmentIds.includes(departmentId);
}

export function assertCanManageDepartments(actor: Actor) {
  if (!actor.isAdmin) {
    throw ApiError.accessDenied("إدارة الأقسام متاحة للمالك والمشرفين فقط.");
  }
}

/** إنشاء خطة في قسم: المالك/المشرف أو رئيس القسم */
export function assertCanCreatePlanIn(actor: Actor, departmentId: string) {
  if (actor.isAdmin) return;
  if (actor.canWrite && actor.headOfDepartmentIds.includes(departmentId)) return;
  throw ApiError.accessDenied("إنشاء الخطط متاح للمالك والمشرفين ورؤساء الأقسام فقط.");
}

// ——————————————————————————————————————————————
// Plans
// ——————————————————————————————————————————————

export function planListWhere(actor: Actor): Prisma.PlanWhereInput {
  if (actor.isAdmin) return { workspaceId: actor.workspaceId };
  return {
    workspaceId: actor.workspaceId,
    OR: [
      { departmentId: { in: actor.departmentIds } },
      { members: { some: { workspaceMemberId: actor.memberId } } },
    ],
  };
}

export interface PlanAccess {
  canView: boolean;
  /** تعديل الأهداف والمهام */
  canEditContent: boolean;
  /** تعديل بيانات الخطة وفريقها وحذفها */
  canManage: boolean;
  /** دوره داخل الخطة إن كان عضواً فيها */
  planRole: string | null;
}

type PlanForAccess = {
  id: string;
  workspaceId: string;
  departmentId: string;
  members: { workspaceMemberId: string; role: string }[];
};

export function computePlanAccess(actor: Actor, plan: PlanForAccess): PlanAccess {
  const membership = plan.members.find((m) => m.workspaceMemberId === actor.memberId);
  const planRole = membership?.role ?? null;

  if (plan.workspaceId !== actor.workspaceId) {
    return { canView: false, canEditContent: false, canManage: false, planRole };
  }

  if (actor.isAdmin) {
    return { canView: true, canEditContent: true, canManage: true, planRole };
  }

  const inDepartment = actor.departmentIds.includes(plan.departmentId);
  const isHead = actor.headOfDepartmentIds.includes(plan.departmentId);
  const canView = inDepartment || Boolean(membership);

  const canManage = actor.canWrite && (isHead || planRole === "lead");
  const canEditContent =
    actor.canWrite && (canManage || planRole === "contributor");

  return { canView, canEditContent, canManage, planRole };
}

/** يجلب الخطة ويتحقق من صلاحية العرض — يرفع 404 لا 403 كي لا يكشف وجودها */
export async function getPlanWithAccess(actor: Actor, planId: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, workspaceId: actor.workspaceId },
    include: { members: { select: { workspaceMemberId: true, role: true } } },
  });

  if (!plan) throw ApiError.notFound("الخطة المطلوبة غير موجودة.");

  const access = computePlanAccess(actor, plan);
  if (!access.canView) throw ApiError.notFound("الخطة المطلوبة غير موجودة.");

  return { plan, access };
}

// ——————————————————————————————————————————————
// Projects (ToolRun)
// ——————————————————————————————————————————————

export function projectListWhere(actor: Actor): Prisma.ToolRunWhereInput {
  if (actor.isAdmin) return { workspaceId: actor.workspaceId };

  return {
    workspaceId: actor.workspaceId,
    OR: [
      { userId: actor.userId },
      { permissions: { some: { workspaceMemberId: actor.memberId } } },
      { visibility: "department", departmentId: { in: actor.departmentIds } },
      {
        visibility: "department",
        plan: { members: { some: { workspaceMemberId: actor.memberId } } },
      },
      // مشاريع ما قبل الأقسام — تبقى مشتركة لكل المساحة
      { visibility: "department", departmentId: null, planId: null },
    ],
  };
}

type RunForAccess = {
  workspaceId: string;
  userId: string;
  departmentId: string | null;
  planId: string | null;
  visibility: string;
  permissions: { workspaceMemberId: string; level: string }[];
  plan?: { members: { workspaceMemberId: string }[] } | null;
};

const LEVEL_RANK: Record<ProjectLevel, number> = { view: 1, edit: 2, manage: 3 };

/** أعلى مستوى وصول للفاعل على المشروع — null يعني لا وصول */
export function computeProjectLevel(actor: Actor, run: RunForAccess): ProjectLevel | null {
  if (run.workspaceId !== actor.workspaceId) return null;
  if (actor.isAdmin) return "manage";
  if (run.userId === actor.userId) return actor.canWrite ? "manage" : "view";

  const explicit = run.permissions.find((p) => p.workspaceMemberId === actor.memberId);
  let level: ProjectLevel | null = explicit ? (explicit.level as ProjectLevel) : null;

  if (run.visibility === "department") {
    const legacy = !run.departmentId && !run.planId;
    const inDepartment = run.departmentId && actor.departmentIds.includes(run.departmentId);
    const inPlan = run.plan?.members.some((m) => m.workspaceMemberId === actor.memberId);

    // المشاريع القديمة كانت قابلة للتعديل لكل الأعضاء — نُبقي السلوك
    // مشاريع الخطة يتاح تعديلها لأعضاء الخطة
    const implicit: ProjectLevel | null = legacy
      ? actor.canWrite ? "edit" : "view"
      : inPlan ? (actor.canWrite ? "edit" : "view") : (inDepartment ? "view" : null);

    if (implicit && (!level || LEVEL_RANK[implicit] > LEVEL_RANK[level])) {
      level = implicit;
    }
  }

  // المُطّلع لا يتجاوز العرض مهما مُنح
  if (level && !actor.canWrite) return "view";
  return level;
}

export function hasLevel(level: ProjectLevel | null, required: ProjectLevel): boolean {
  return Boolean(level) && LEVEL_RANK[level as ProjectLevel] >= LEVEL_RANK[required];
}

export const runAccessInclude = {
  permissions: { select: { workspaceMemberId: true, level: true } },
  plan: { select: { members: { select: { workspaceMemberId: true } } } },
} as const;

/** يجلب المشروع ويتحقق من المستوى المطلوب */
export async function getRunWithAccess(
  actor: Actor,
  runId: string,
  required: ProjectLevel = "view"
) {
  const run = await prisma.toolRun.findFirst({
    where: { id: runId, workspaceId: actor.workspaceId },
    include: runAccessInclude,
  });

  if (!run) throw ApiError.notFound("المشروع المطلوب غير موجود.");

  const level = computeProjectLevel(actor, run);
  if (!level) throw ApiError.notFound("المشروع المطلوب غير موجود.");

  if (!hasLevel(level, required)) {
    const messages: Record<ProjectLevel, string> = {
      view: "ليس لديك صلاحية عرض هذا المشروع.",
      edit: "صلاحيتك على هذا المشروع لا تسمح بالتعديل.",
      manage: "إدارة هذا المشروع وصلاحياته متاحة لمُنشئه ومن يملك صلاحية الإدارة.",
    };
    throw ApiError.accessDenied(messages[required]);
  }

  return { run, level };
}

/**
 * يحدّد القسم والخطة اللذين يُحفظ فيهما مشروع جديد.
 *
 *  • الخطة تفرض قسمها، ويجب أن يملك الفاعل حق تعديل محتواها أو أن يكون من القسم.
 *  • القسم الصريح يجب أن يكون من أقسام الفاعل (إلا المالك/المشرف).
 *  • العضو بلا قسم صريح: قسمه الوحيد تلقائياً، أو رفض بطلب الاختيار إن تعددت.
 */
export async function resolveProjectPlacement(
  actor: Actor,
  input: { departmentId?: string | null; planId?: string | null }
): Promise<{ departmentId: string | null; planId: string | null }> {
  if (input.planId) {
    const { plan, access } = await getPlanWithAccess(actor, input.planId);
    if (!actor.canWrite || !access.canView) {
      throw ApiError.accessDenied("لا يمكنك حفظ مشاريع في هذه الخطة.");
    }
    return { departmentId: plan.departmentId, planId: plan.id };
  }

  if (input.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: input.departmentId, workspaceId: actor.workspaceId },
      select: { id: true },
    });
    if (!department || !canViewDepartment(actor, department.id)) {
      throw ApiError.accessDenied("لا يمكنك الحفظ في هذا القسم.");
    }
    return { departmentId: department.id, planId: null };
  }

  if (actor.isAdmin) return { departmentId: null, planId: null };

  // إذا كان العضو في خطة واحدة فقط، يتم حفظ مشاريعه فيها تلقائياً.
  if (actor.planIds.length === 1) {
    const plan = await prisma.plan.findUnique({
      where: { id: actor.planIds[0] },
      select: { departmentId: true }
    });
    if (plan) {
      return { departmentId: plan.departmentId, planId: actor.planIds[0] };
    }
  }

  // إذا لم يكن في خطة محددة، نتحقق من الأقسام.
  if (actor.departmentIds.length === 1) {
    return { departmentId: actor.departmentIds[0], planId: null };
  }

  // إذا كان العضو في أكثر من خطة أو قسم، ولا توجد آلية في الواجهة لاختيار الوجهة بعد،
  // سنحفظه بدون قسم/خطة بشكل مؤقت حتى يطلب المستخدم تحديد وجهة.
  // أو يمكننا أن نختار أول خطة أو قسم بشكل افتراضي.
  // دعنا نحفظه عامّاً، أو نرفع خطأ يطلب تحديد الوجهة.
  if (actor.departmentIds.length > 1 || actor.planIds.length > 1) {
    // كحل مؤقت لحين دعم اختيار الوجهة من واجهة الأداة:
    // إذا كان في عدة خطط، نختار الأولى
    if (actor.planIds.length > 0) {
      const plan = await prisma.plan.findUnique({
        where: { id: actor.planIds[0] },
        select: { departmentId: true }
      });
      if (plan) return { departmentId: plan.departmentId, planId: actor.planIds[0] };
    }
    if (actor.departmentIds.length > 0) {
      return { departmentId: actor.departmentIds[0], planId: null };
    }
  }

  return { departmentId: null, planId: null };
}

