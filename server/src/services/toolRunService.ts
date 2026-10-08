import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  type Actor,
  type ProjectLevel,
  computeProjectLevel,
  getRunWithAccess,
  projectListWhere,
  resolveProjectPlacement,
  runAccessInclude,
} from "./accessService";
import { assertWorkspaceMembers, memberSelect, toMember } from "./orgHelpers";

/** حدّ حجم الحمولة المحفوظة — يمنع إغراق الجدول بمخرجات ضخمة */
const MAX_PAYLOAD_CHARS = 400_000;

/** أقصى ما يُعاد في صفحة واحدة */
const MAX_PAGE_SIZE = 100;

export interface SaveToolRunInput {
  id?: string;
  toolSlug: string;
  title: string;
  summary?: string;
  input: unknown;
  output: unknown;
  /** مكان الحفظ في الهيكل التنظيمي — يُعتمد عند الإنشاء فقط */
  departmentId?: string | null;
  planId?: string | null;
}

/** الشكل المختصر لبطاقة لوحة التحكم — بلا الحمولة الكاملة */
const listSelect = {
  id: true,
  toolSlug: true,
  title: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
  visibility: true,
  workspaceId: true,
  userId: true,
  departmentId: true,
  planId: true,
  user: { select: { id: true, name: true } },
  department: { select: { id: true, name: true, color: true, icon: true } },
  plan: { select: { id: true, name: true, members: { select: { workspaceMemberId: true } } } },
  permissions: { select: { workspaceMemberId: true, level: true } },
} as const;

type ListRow = {
  id: string;
  toolSlug: string;
  title: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  visibility: string;
  workspaceId: string;
  userId: string;
  departmentId: string | null;
  planId: string | null;
  user: { id: string; name: string };
  department: { id: string; name: string; color: string; icon: string } | null;
  plan: { id: string; name: string; members: { workspaceMemberId: string }[] } | null;
  permissions: { workspaceMemberId: string; level: string }[];
};

/** يُخفي تفاصيل الوصول الداخلية ويُرفق مستوى الفاعل */
function present(actor: Actor, row: ListRow) {
  const access = computeProjectLevel(actor, row);
  return {
    id: row.id,
    toolSlug: row.toolSlug,
    title: row.title,
    summary: row.summary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    visibility: row.visibility,
    user: row.user,
    department: row.department,
    plan: row.plan ? { id: row.plan.id, name: row.plan.name } : null,
    sharedWith: row.permissions.length,
    access,
  };
}

function serialize(value: unknown, field: string): string {
  const json = JSON.stringify(value ?? null);

  if (json.length > MAX_PAYLOAD_CHARS) {
    throw ApiError.invalidInput("حجم البيانات المحفوظة كبير جداً.", [
      { field, issue: `الحد الأقصى ${MAX_PAYLOAD_CHARS} حرفاً.` },
    ]);
  }

  return json;
}

/** JSON التالف لا يُسقط الصفحة كلها — البطاقة تظهر ومحتواها فارغ */
function parse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * حفظ مخرجات أداة — يُنشئ سجلاً جديداً أو يُحدّث القائم.
 *
 * التحديث لا الإضافة هو السلوك الافتراضي حين تُمرَّر الواجهة معرّفاً:
 * إعادة توليد التحليل نفسه أو تعديل بنوده يجب ألا تُراكم نسخاً في
 * لوحة التحكم.
 *
 * الإنشاء يحدّد القسم والخطة عبر resolveProjectPlacement: العضو يحفظ في
 * قسمه دائماً، والتحديث يتطلب صلاحية «تعديل» على المشروع.
 */
export async function saveToolRun(actor: Actor, data: SaveToolRunInput) {
  const title = data.title?.trim();

  if (!title) {
    throw ApiError.invalidInput("عنوان التحليل مطلوب.", [
      { field: "title", issue: "العنوان مطلوب." },
    ]);
  }

  const payload = {
    toolSlug: data.toolSlug,
    title: title.slice(0, 150),
    summary: data.summary?.trim().slice(0, 300) || null,
    input: serialize(data.input, "input"),
    output: serialize(data.output, "output"),
  };

  if (data.id) {
    // التحديث مشروط بمساحة العمل وبصلاحية التعديل: معرّف من مساحة أخرى
    // لا يُحدَّث ولا يُنشئ سجلاً بديلاً — نرفضه صراحةً بدل تجاوزه بصمت.
    const { run } = await getRunWithAccess(actor, data.id, "edit");

    const updated = await prisma.toolRun.update({
      where: { id: run.id },
      data: payload,
      select: listSelect,
    });
    return present(actor, updated);
  }

  const placement = await resolveProjectPlacement(actor, {
    departmentId: data.departmentId,
    planId: data.planId,
  });

  const created = await prisma.toolRun.create({
    data: { ...payload, ...placement, workspaceId: actor.workspaceId, userId: actor.userId },
    select: listSelect,
  });
  return present(actor, created);
}

/** قائمة المشاريع المرئية للفاعل — أحدثها أولاً، مع فلاتر اختيارية */
export async function listToolRuns(
  actor: Actor,
  options: {
    toolSlug?: string;
    departmentId?: string;
    planId?: string;
    mine?: boolean;
    limit?: number;
  } = {}
) {
  const runs = await prisma.toolRun.findMany({
    where: {
      AND: [
        projectListWhere(actor),
        options.toolSlug ? { toolSlug: options.toolSlug } : {},
        options.departmentId ? { departmentId: options.departmentId } : {},
        options.planId ? { planId: options.planId } : {},
        options.mine ? { userId: actor.userId } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: Math.min(options.limit ?? 50, MAX_PAGE_SIZE),
    select: listSelect,
  });

  return runs.map((r) => present(actor, r));
}

/** تحليل واحد بحمولته الكاملة — لإعادة فتحه داخل أداته */
export async function getToolRun(actor: Actor, id: string) {
  const { level } = await getRunWithAccess(actor, id, "view");

  const run = await prisma.toolRun.findUniqueOrThrow({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, color: true, icon: true } },
      plan: { select: { id: true, name: true } },
    },
  });

  return {
    id: run.id,
    toolSlug: run.toolSlug,
    title: run.title,
    summary: run.summary,
    input: parse(run.input),
    output: parse(run.output),
    user: run.user,
    department: run.department,
    plan: run.plan,
    visibility: run.visibility,
    access: level,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

/** حذف مشروع — للمُنشئ ومن يملك «إدارة» والمالك/المشرفين */
export async function deleteToolRun(actor: Actor, id: string) {
  await getRunWithAccess(actor, id, "manage");
  await prisma.toolRun.delete({ where: { id } });
  return { message: "تم حذف التحليل بنجاح." };
}

// ——————————————————————————————————————————————
// صلاحيات المشروع
// ——————————————————————————————————————————————

const LEVELS: ProjectLevel[] = ["view", "edit", "manage"];

export async function getProjectPermissions(actor: Actor, id: string) {
  const { run, level } = await getRunWithAccess(actor, id, "view");

  const [permissions, owner, departmentMembers] = await Promise.all([
    prisma.projectPermission.findMany({
      where: { toolRunId: id },
      orderBy: { createdAt: "asc" },
      include: { workspaceMember: { select: memberSelect } },
    }),
    prisma.workspaceMember.findFirst({
      where: { workspaceId: actor.workspaceId, userId: run.userId },
      select: memberSelect,
    }),
    run.departmentId
      ? prisma.departmentMember.count({ where: { departmentId: run.departmentId } })
      : Promise.resolve(0),
  ]);

  return {
    projectId: run.id,
    visibility: run.visibility,
    canManage: level === "manage",
    owner: owner ? toMember(owner) : null,
    departmentMembersCount: departmentMembers,
    permissions: permissions.map((p) => ({
      member: toMember(p.workspaceMember),
      level: p.level,
    })),
  };
}

export async function setProjectPermissions(
  actor: Actor,
  id: string,
  input: { visibility?: string; permissions?: { memberId: string; level: string }[] }
) {
  const { run } = await getRunWithAccess(actor, id, "manage");

  const visibility =
    input.visibility === "restricted" || input.visibility === "department"
      ? input.visibility
      : run.visibility;

  const map = new Map<string, ProjectLevel>();
  for (const p of input.permissions ?? []) {
    if (!p?.memberId) continue;
    map.set(p.memberId, LEVELS.includes(p.level as ProjectLevel) ? (p.level as ProjectLevel) : "view");
  }
  const entries = Array.from(map, ([memberId, level]) => ({ memberId, level }));
  await assertWorkspaceMembers(actor.workspaceId, entries.map((e) => e.memberId));

  await prisma.$transaction([
    prisma.toolRun.update({ where: { id }, data: { visibility } }),
    prisma.projectPermission.deleteMany({
      where: { toolRunId: id, workspaceMemberId: { notIn: entries.map((e) => e.memberId) } },
    }),
    ...entries.map((e) =>
      prisma.projectPermission.upsert({
        where: { toolRunId_workspaceMemberId: { toolRunId: id, workspaceMemberId: e.memberId } },
        create: { toolRunId: id, workspaceMemberId: e.memberId, level: e.level },
        update: { level: e.level },
      })
    ),
  ]);

  return getProjectPermissions(actor, id);
}

/** نقل مشروع إلى قسم/خطة — يتطلب «إدارة» على المشروع ووصولاً للوجهة */
export async function moveToolRun(
  actor: Actor,
  id: string,
  input: { departmentId?: string | null; planId?: string | null }
) {
  await getRunWithAccess(actor, id, "manage");
  const placement = await resolveProjectPlacement(actor, input);

  const updated = await prisma.toolRun.update({
    where: { id },
    data: placement,
    select: listSelect,
  });
  return present(actor, updated);
}

// إعادة تصدير لتسهيل الاستخدام في المتحكّم
export { runAccessInclude };
