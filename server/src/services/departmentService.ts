import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  type Actor,
  assertCanManageDepartments,
  canViewDepartment,
  departmentListWhere,
  planListWhere,
  projectListWhere,
} from "./accessService";
import {
  assertWorkspaceMembers,
  memberSelect,
  toMember,
  weightedProgress,
} from "./orgHelpers";

// ——————————————————————————————————————————————
// departmentService — الأقسام وأعضاؤها
// ——————————————————————————————————————————————

export const DEPARTMENT_COLORS = [
  "indigo", "violet", "sky", "emerald", "amber", "rose", "teal", "orange", "fuchsia", "slate",
] as const;

export const DEPARTMENT_ICONS = [
  "building", "megaphone", "wallet", "users", "cpu", "truck", "headset", "scale", "palette", "chart",
] as const;

export interface DepartmentMemberInput {
  memberId: string;
  role?: "head" | "member";
}

export interface DepartmentInput {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  members?: DepartmentMemberInput[];
}

function cleanMembers(members: DepartmentMemberInput[] = []) {
  const map = new Map<string, "head" | "member">();
  for (const m of members) {
    if (!m?.memberId) continue;
    map.set(m.memberId, m.role === "head" ? "head" : "member");
  }
  return Array.from(map, ([memberId, role]) => ({ memberId, role }));
}

/** قائمة الأقسام مع مؤشراتها — ما يحتاجه كرت القسم دون نداء إضافي */
export async function listDepartments(actor: Actor) {
  const departments = await prisma.department.findMany({
    where: departmentListWhere(actor),
    orderBy: { createdAt: "asc" },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        include: { workspaceMember: { select: memberSelect } },
      },
      plans: {
        where: planListWhere(actor),
        select: {
          id: true,
          status: true,
          tasks: { select: { weight: true, progress: true, status: true } },
        },
      },
      _count: { select: { toolRuns: { where: projectListWhere(actor) } } },
    },
  });

  return departments.map((d) => {
    const activePlans = d.plans.filter((p) => p.status === "active");
    const allTasks = d.plans.flatMap((p) => p.tasks);
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      color: d.color,
      icon: d.icon,
      createdAt: d.createdAt,
      membersCount: d.members.length,
      members: d.members.map((m) => ({ ...toMember(m.workspaceMember), departmentRole: m.role })),
      plansCount: d.plans.length,
      activePlansCount: activePlans.length,
      projectsCount: d._count.toolRuns,
      tasksCount: allTasks.length,
      progress: weightedProgress(allTasks),
      isMember: actor.departmentIds.includes(d.id),
      isHead: actor.headOfDepartmentIds.includes(d.id),
    };
  });
}

export async function getDepartment(actor: Actor, id: string) {
  if (!canViewDepartment(actor, id)) throw ApiError.notFound("القسم المطلوب غير موجود.");

  const list = await listDepartments(actor);
  const department = list.find((d) => d.id === id);
  if (!department) throw ApiError.notFound("القسم المطلوب غير موجود.");

  return department;
}

export async function createDepartment(actor: Actor, input: DepartmentInput) {
  assertCanManageDepartments(actor);

  const name = input.name?.trim();
  if (!name) throw ApiError.invalidInput("اسم القسم مطلوب.");

  const members = cleanMembers(input.members);
  await assertWorkspaceMembers(actor.workspaceId, members.map((m) => m.memberId));

  const exists = await prisma.department.findFirst({
    where: { workspaceId: actor.workspaceId, name },
    select: { id: true },
  });
  if (exists) throw new ApiError(409, "DUPLICATE", "يوجد قسم بهذا الاسم بالفعل.");

  const department = await prisma.department.create({
    data: {
      workspaceId: actor.workspaceId,
      name: name.slice(0, 80),
      description: input.description?.trim().slice(0, 500) || null,
      color: (DEPARTMENT_COLORS as readonly string[]).includes(input.color ?? "") ? input.color! : "indigo",
      icon: (DEPARTMENT_ICONS as readonly string[]).includes(input.icon ?? "") ? input.icon! : "building",
      createdById: actor.userId,
      members: {
        create: members.map((m) => ({ workspaceMemberId: m.memberId, role: m.role })),
      },
    },
    select: { id: true },
  });

  return getDepartment({ ...actor, isAdmin: true }, department.id);
}

export async function updateDepartment(actor: Actor, id: string, input: DepartmentInput) {
  assertCanManageDepartments(actor);

  const current = await prisma.department.findFirst({
    where: { id, workspaceId: actor.workspaceId },
    select: { id: true, name: true },
  });
  if (!current) throw ApiError.notFound("القسم المطلوب غير موجود.");

  const name = input.name?.trim();
  if (name && name !== current.name) {
    const dup = await prisma.department.findFirst({
      where: { workspaceId: actor.workspaceId, name, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new ApiError(409, "DUPLICATE", "يوجد قسم بهذا الاسم بالفعل.");
  }

  await prisma.department.update({
    where: { id },
    data: {
      ...(name ? { name: name.slice(0, 80) } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim().slice(0, 500) || null }
        : {}),
      ...(input.color && (DEPARTMENT_COLORS as readonly string[]).includes(input.color)
        ? { color: input.color }
        : {}),
      ...(input.icon && (DEPARTMENT_ICONS as readonly string[]).includes(input.icon)
        ? { icon: input.icon }
        : {}),
    },
  });

  if (input.members) await setDepartmentMembers(actor, id, input.members);

  return getDepartment(actor, id);
}

/** استبدال قائمة الأعضاء كاملة — أبسط وأسلم من فروقات الإضافة والحذف */
export async function setDepartmentMembers(
  actor: Actor,
  id: string,
  input: DepartmentMemberInput[]
) {
  assertCanManageDepartments(actor);

  const department = await prisma.department.findFirst({
    where: { id, workspaceId: actor.workspaceId },
    select: { id: true },
  });
  if (!department) throw ApiError.notFound("القسم المطلوب غير موجود.");

  const members = cleanMembers(input);
  await assertWorkspaceMembers(actor.workspaceId, members.map((m) => m.memberId));

  await prisma.$transaction([
    prisma.departmentMember.deleteMany({
      where: { departmentId: id, workspaceMemberId: { notIn: members.map((m) => m.memberId) } },
    }),
    ...members.map((m) =>
      prisma.departmentMember.upsert({
        where: { departmentId_workspaceMemberId: { departmentId: id, workspaceMemberId: m.memberId } },
        create: { departmentId: id, workspaceMemberId: m.memberId, role: m.role },
        update: { role: m.role },
      })
    ),
  ]);

  return getDepartment(actor, id);
}

export async function deleteDepartment(actor: Actor, id: string) {
  assertCanManageDepartments(actor);

  const department = await prisma.department.findFirst({
    where: { id, workspaceId: actor.workspaceId },
    select: { id: true, _count: { select: { plans: true } } },
  });
  if (!department) throw ApiError.notFound("القسم المطلوب غير موجود.");

  if (department._count.plans > 0) {
    throw new ApiError(
      409,
      "DEPARTMENT_HAS_PLANS",
      `لا يمكن حذف القسم لأنه يحتوي على ${department._count.plans} خطة. انقل الخطط أو احذفها أولاً.`
    );
  }

  // مشاريع القسم تبقى في المساحة (SetNull) — لا يضيع عمل الفريق بحذف الهيكل
  await prisma.department.delete({ where: { id } });
  return { message: "تم حذف القسم." };
}
