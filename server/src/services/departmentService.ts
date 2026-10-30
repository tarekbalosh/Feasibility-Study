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
  managerId?: string | null;
  members?: DepartmentMemberInput[];
}

export interface DepartmentTasksFilter {
  status?: string | string[];
  assignee?: string | string[];
  planId?: string;
  search?: string;
  q?: string;
  page?: string | number;
  limit?: string | number;
}

function cleanMembers(members: DepartmentMemberInput[] = [], managerId?: string | null) {
  const map = new Map<string, "head" | "member">();
  for (const m of members) {
    if (!m?.memberId) continue;
    map.set(m.memberId, m.role === "head" ? "head" : "member");
  }

  if (managerId) {
    // إزالة صفة رئيس القسم عن أي عضو آخر وتعيين المدير رئيساً
    for (const [mid] of map) {
      map.set(mid, mid === managerId ? "head" : "member");
    }
    map.set(managerId, "head");
  } else if (managerId === null) {
    // إزالة رئيس القسم صراحة إن حُدد null
    for (const [mid, role] of map) {
      if (role === "head") map.set(mid, "member");
    }
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
          members: { 
            select: { 
              workspaceMemberId: true,
              workspaceMember: { select: { role: true } }
            } 
          },
          tasks: { select: { weight: true, progress: true, status: true } },
        },
      },
      _count: { select: { toolRuns: { where: projectListWhere(actor) } } },
    },
  });

  return departments.map((d) => {
    const activePlans = d.plans.filter((p) => p.status === "active");
    const allTasks = d.plans.flatMap((p) => p.tasks);
    
    const uniqueMemberIds = new Set<string>();
    
    d.members.forEach(m => {
      if (m.workspaceMember.role !== 'owner' && m.workspaceMember.role !== 'admin') {
        uniqueMemberIds.add(m.workspaceMemberId);
      }
    });
    
    d.plans.forEach(p => {
      p.members.forEach(m => {
        if (m.workspaceMember.role !== 'owner' && m.workspaceMember.role !== 'admin') {
          uniqueMemberIds.add(m.workspaceMemberId);
        }
      });
    });

    const headMember = d.members.find((m) => m.role === "head");
    const head = headMember
      ? {
          ...toMember(headMember.workspaceMember),
          departmentRole: "head",
        }
      : null;

    return {
      id: d.id,
      name: d.name,
      description: d.description,
      color: d.color,
      icon: d.icon,
      createdAt: d.createdAt,
      head,
      membersCount: uniqueMemberIds.size,
      members: d.members.map((m) => ({ ...toMember(m.workspaceMember), departmentRole: m.role })),
      plansCount: d.plans.length,
      activePlansCount: activePlans.length,
      projectsCount: d._count.toolRuns,
      tasksCount: allTasks.length,
      progress: weightedProgress(allTasks),
      isMember: actor.departmentIds.includes(d.id),
      isHead: actor.headOfDepartmentIds.includes(d.id),
      canCreatePlan: actor.isAdmin || actor.headOfDepartmentIds.includes(d.id),
    };
  });
}

export async function getDepartment(actor: Actor, id: string, filterInput?: DepartmentTasksFilter) {
  // 1. التحقق من وجود القسم في مساحة العمل
  const departmentRecord = await prisma.department.findFirst({
    where: { id, workspaceId: actor.workspaceId },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        include: { workspaceMember: { select: memberSelect } },
      },
    },
  });

  if (!departmentRecord) {
    throw ApiError.notFound("القسم المطلوب غير موجود.");
  }

  // 2. التحقق من صلاحية الوصول للقسم (إرجاع 403 صراحة إن لم يملك المستخدم صلاحية)
  if (!canViewDepartment(actor, id)) {
    throw ApiError.accessDenied("ليس لديك صلاحية الوصول إلى هذا القسم.");
  }

  const isHead = actor.headOfDepartmentIds.includes(id);
  const isManager = actor.isAdmin || isHead;

  // 3. جلب الخطط التشغيلية التابعة للقسم مع الصلاحيات
  const plans = await prisma.plan.findMany({
    where: {
      departmentId: id,
      workspaceId: actor.workspaceId,
      ...(actor.isAdmin ? {} : planListWhere(actor)),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      members: {
        take: 5,
        select: { workspaceMember: { select: memberSelect } },
      },
      tasks: {
        where: isManager
          ? {}
          : {
              OR: [{ assigneeMemberId: actor.memberId }, { followerMemberId: actor.memberId }],
            },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          weight: true,
          cost: true,
          dueDate: true,
          priority: true,
          assigneeMemberId: true,
          followerMemberId: true,
          assignee: { select: memberSelect },
          follower: { select: memberSelect },
          goal: { select: { id: true, title: true } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { members: true, goals: true } },
    },
  });

  // 4. استخراج المهام وتوحيد بياناتها
  const planTasks = plans.flatMap((p) =>
    p.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      progress: t.progress,
      priority: t.priority,
      cost: t.cost || 0,
      currency: "SAR",
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assignee: t.assignee ? toMember(t.assignee).name : "غير محدد",
      follower: t.follower ? toMember(t.follower).name : "غير محدد",
      planId: p.id,
      planName: p.name,
      goalTitle: t.goal?.title || null,
    }))
  );

  // 5. جلب مهام SWOT المرتبطة بالقسم إن وجدت
  const swotGoals = await prisma.swotCustomGoal.findMany({
    where: {
      toolRun: {
        departmentId: id,
        workspaceId: actor.workspaceId,
        ...(actor.isAdmin ? {} : projectListWhere(actor)),
      },
    },
    include: {
      tasks: {
        orderBy: { dueDate: "asc" },
      },
      toolRun: {
        select: { id: true, title: true },
      },
    },
  });

  // تصفية مهام SWOT للعضو العادي
  const actorIdentifiers = new Set<string>();
  actorIdentifiers.add(actor.memberId);
  if (actor.userId) actorIdentifiers.add(actor.userId);
  const currentMember = await prisma.workspaceMember.findUnique({
    where: { id: actor.memberId },
    select: { email: true, user: { select: { name: true } } },
  });
  if (currentMember?.user?.name) {
    actorIdentifiers.add(currentMember.user.name.trim().toLowerCase());
    actorIdentifiers.add(currentMember.user.name.trim());
  }
  if (currentMember?.email) {
    actorIdentifiers.add(currentMember.email.trim().toLowerCase());
    actorIdentifiers.add(currentMember.email.trim());
  }
  const matchesActor = (val: string | null | undefined): boolean => {
    if (!val) return false;
    const s = val.trim();
    return actorIdentifiers.has(s) || actorIdentifiers.has(s.toLowerCase());
  };

  const swotTasksFormatted = swotGoals.flatMap((g) => {
    const rawTasks = isManager
      ? g.tasks
      : g.tasks.filter((t) => matchesActor(t.assignee) || matchesActor(t.follower));
    return rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      progress: t.progress,
      priority: t.priority,
      cost: t.cost || 0,
      currency: t.currency || "SAR",
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assignee: t.assignee || "غير محدد",
      follower: t.follower || "غير محدد",
      planId: null,
      planName: g.toolRun?.title || "تحليل SWOT",
      goalTitle: g.goalText,
    }));
  });

  const allScopedTasks = [...planTasks, ...swotTasksFormatted];

  // 6. حساب الميزانية ونسبة الإنجاز الإجمالية
  const totalBudget = allScopedTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const overallProgress = weightedProgress(
    allScopedTasks.map((t) => ({
      weight: 1,
      progress: t.progress,
      status: t.status === "completed" || t.progress === 100 ? "done" : t.status,
    }))
  );

  // حساب الحالات بدقة
  const getTaskEffectiveStatus = (t: { status: string; progress: number; dueDate: string | null }): "todo" | "in_progress" | "done" | "overdue" => {
    if (t.status === "done" || t.status === "completed" || t.progress >= 100) return "done";
    if (t.dueDate && new Date(t.dueDate).getTime() < Date.now()) return "overdue";
    if (t.status === "in_progress" || t.progress > 0) return "in_progress";
    return "todo";
  };

  const statusCounts = {
    all: allScopedTasks.length,
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
  };

  for (const t of allScopedTasks) {
    const s = getTaskEffectiveStatus(t);
    statusCounts[s]++;
  }

  // قائمة المسؤولين المتاحة للمستخدم الحالي دون أي تسريب لأسماء لا يراها
  const availableAssigneesSet = new Set<string>();
  for (const t of allScopedTasks) {
    availableAssigneesSet.add(t.assignee || "غير محدد");
  }
  const availableAssignees = Array.from(availableAssigneesSet).sort();

  // 7. تطبيق الفلاتر الخادمة
  let filteredTasks = allScopedTasks;

  const parseArrayParam = (val?: string | string[]): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.flatMap((v) => v.split(",")).map((s) => s.trim()).filter(Boolean);
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const statusFilter = parseArrayParam(filterInput?.status);
  if (statusFilter.length > 0 && !statusFilter.includes("all")) {
    filteredTasks = filteredTasks.filter((t) => statusFilter.includes(getTaskEffectiveStatus(t)));
  }

  const assigneeFilter = parseArrayParam(filterInput?.assignee);
  if (assigneeFilter.length > 0) {
    filteredTasks = filteredTasks.filter((t) => assigneeFilter.includes(t.assignee || "غير محدد"));
  }

  const planIdFilter = typeof filterInput?.planId === "string" ? filterInput.planId.trim() : undefined;
  if (planIdFilter) {
    filteredTasks = filteredTasks.filter((t) => t.planId === planIdFilter);
  }

  const searchParam = filterInput?.search || filterInput?.q;
  const searchQuery = typeof searchParam === "string" ? searchParam.trim().toLowerCase() : "";
  if (searchQuery) {
    filteredTasks = filteredTasks.filter((t) => t.title.toLowerCase().includes(searchQuery));
  }

  // 8. ترقيم الصفحات (Pagination)
  const totalFilteredCount = filteredTasks.length;
  const page = Math.max(1, Number(filterInput?.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filterInput?.limit) || 20));
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / limit));
  const paginatedTasks = filteredTasks.slice((page - 1) * limit, page * limit);

  // 9. تحديد رئيس القسم (Head)
  const headMember = departmentRecord.members.find((m) => m.role === "head");
  const head = headMember
    ? {
        ...toMember(headMember.workspaceMember),
        departmentRole: "head",
      }
    : null;

  // 10. حساب عدد الأعضاء الفعلي
  const uniqueMemberIds = new Set<string>();
  departmentRecord.members.forEach((m) => {
    if (m.workspaceMember.role !== "owner" && m.workspaceMember.role !== "admin") {
      uniqueMemberIds.add(m.workspaceMemberId);
    }
  });

  const formattedPlans = plans.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    tasksCount: p.tasks.length,
    progress: weightedProgress(p.tasks),
    budget: p.tasks.reduce((acc, t) => acc + (t.cost || 0), 0),
    membersCount: p._count.members,
  }));

  return {
    id: departmentRecord.id,
    name: departmentRecord.name,
    description: departmentRecord.description,
    color: departmentRecord.color,
    icon: departmentRecord.icon,
    createdAt: departmentRecord.createdAt,
    head,
    membersCount: Math.max(uniqueMemberIds.size, departmentRecord.members.length),
    members: departmentRecord.members.map((m) => ({
      ...toMember(m.workspaceMember),
      departmentRole: m.role,
    })),
    plans: formattedPlans,
    plansCount: formattedPlans.length,
    activePlansCount: formattedPlans.filter((p) => p.status === "active").length,
    tasks: paginatedTasks,
    tasksCount: totalFilteredCount,
    totalTasksCount: allScopedTasks.length,
    statusCounts,
    availableAssignees,
    pagination: {
      page,
      limit,
      totalPages,
      totalCount: totalFilteredCount,
    },
    progress: overallProgress,
    budget: Math.round(totalBudget),
    currency: "SAR",
    isMember: actor.departmentIds.includes(departmentRecord.id),
    isHead,
    canCreatePlan: actor.isAdmin || isHead,
  };
}

export async function createDepartment(actor: Actor, input: DepartmentInput) {
  assertCanManageDepartments(actor);

  const name = input.name?.trim();
  if (!name) throw ApiError.invalidInput("اسم القسم مطلوب.");

  const members = cleanMembers(input.members, input.managerId);
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

  if (input.managerId !== undefined && !input.members) {
    const currentMembers = await prisma.departmentMember.findMany({
      where: { departmentId: id },
    });
    const updated = cleanMembers(
      currentMembers.map((cm) => ({
        memberId: cm.workspaceMemberId,
        role: cm.role as "head" | "member",
      })),
      input.managerId
    );
    await setDepartmentMembers(actor, id, updated);
  } else if (input.members) {
    const updated = cleanMembers(input.members, input.managerId);
    await setDepartmentMembers(actor, id, updated);
  }

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
