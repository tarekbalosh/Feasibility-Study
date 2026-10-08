import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  type Actor,
  type PlanAccess,
  assertCanCreatePlanIn,
  computePlanAccess,
  getPlanWithAccess,
  getRunWithAccess,
  planListWhere,
  projectListWhere,
} from "./accessService";
import {
  assertWorkspaceMembers,
  goalProgress,
  isOverdue,
  memberSelect,
  parseDate,
  toMember,
  weightedProgress,
} from "./orgHelpers";

// ——————————————————————————————————————————————
// planService — الخطط وفرقها وأهدافها ومهامها
// ——————————————————————————————————————————————

export const PLAN_STATUSES = ["draft", "active", "on_hold", "completed", "archived"] as const;
export const PLAN_ROLES = ["lead", "contributor", "viewer"] as const;
export const GOAL_STATUSES = ["not_started", "in_progress", "completed"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

type PlanRole = (typeof PLAN_ROLES)[number];

export interface PlanMemberInput {
  memberId: string;
  role?: PlanRole;
}

export interface PlanInput {
  departmentId?: string;
  name?: string;
  description?: string | null;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  members?: PlanMemberInput[];
  goals?: { title: string; description?: string }[];
}

const oneOf = <T extends readonly string[]>(list: T, value: unknown, fallback: T[number]) =>
  (list as readonly string[]).includes(value as string) ? (value as T[number]) : fallback;

function cleanPlanMembers(members: PlanMemberInput[] = []) {
  const map = new Map<string, PlanRole>();
  for (const m of members) {
    if (!m?.memberId) continue;
    map.set(m.memberId, oneOf(PLAN_ROLES, m.role, "contributor"));
  }
  return Array.from(map, ([memberId, role]) => ({ memberId, role }));
}

function assertDates(start?: Date | null, end?: Date | null) {
  if (start && end && end.getTime() < start.getTime()) {
    throw ApiError.invalidInput("تاريخ نهاية الخطة يجب أن يكون بعد تاريخ بدايتها.");
  }
}

const departmentBrief = { select: { id: true, name: true, color: true, icon: true } } as const;

// ——————————————————————————————————————————————
// Plans
// ——————————————————————————————————————————————

function summarizePlan(
  actor: Actor,
  plan: {
    id: string;
    workspaceId: string;
    departmentId: string;
    name: string;
    description: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    department: { id: string; name: string; color: string; icon: string };
    members: { workspaceMemberId: string; role: string; workspaceMember: Parameters<typeof toMember>[0] }[];
    goals: { id: string; status: string }[];
    tasks: { weight: number; progress: number; status: string; dueDate: Date | null }[];
    _count: { toolRuns: number };
  }
) {
  const access = computePlanAccess(actor, plan);
  const doneTasks = plan.tasks.filter((t) => t.status === "done").length;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    startDate: plan.startDate,
    endDate: plan.endDate,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    department: plan.department,
    members: plan.members.map((m) => ({ ...toMember(m.workspaceMember), planRole: m.role })),
    stats: {
      goals: plan.goals.length,
      goalsCompleted: plan.goals.filter((g) => g.status === "completed").length,
      tasks: plan.tasks.length,
      tasksDone: doneTasks,
      tasksOverdue: plan.tasks.filter(isOverdue).length,
      projects: plan._count.toolRuns,
      progress: weightedProgress(plan.tasks),
    },
    access,
  };
}

function planInclude(actor: Actor) {
  return {
    department: departmentBrief,
    members: {
      orderBy: [{ role: "asc" as const }, { createdAt: "asc" as const }],
      include: { workspaceMember: { select: memberSelect } },
    },
    goals: { select: { id: true, status: true } },
    tasks: { select: { weight: true, progress: true, status: true, dueDate: true } },
    _count: { select: { toolRuns: { where: projectListWhere(actor) } } },
  };
}

export async function listPlans(
  actor: Actor,
  filters: { departmentId?: string; status?: string } = {}
) {
  const plans = await prisma.plan.findMany({
    where: {
      AND: [
        planListWhere(actor),
        filters.departmentId ? { departmentId: filters.departmentId } : {},
        filters.status ? { status: filters.status } : {},
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
    include: planInclude(actor),
  });

  return plans.map((p) => summarizePlan(actor, p));
}

export async function getPlan(actor: Actor, id: string) {
  await getPlanWithAccess(actor, id);

  const plan = await prisma.plan.findUniqueOrThrow({
    where: { id },
    include: planInclude(actor),
  });

  return summarizePlan(actor, plan);
}

export async function createPlan(actor: Actor, input: PlanInput) {
  if (!input.departmentId) throw ApiError.invalidInput("اختر القسم الذي تتبع له الخطة.");

  const department = await prisma.department.findFirst({
    where: { id: input.departmentId, workspaceId: actor.workspaceId },
    select: { id: true },
  });
  if (!department) throw ApiError.notFound("القسم المختار غير موجود.");

  assertCanCreatePlanIn(actor, department.id);

  const name = input.name?.trim();
  if (!name) throw ApiError.invalidInput("اسم الخطة مطلوب.");

  const startDate = parseDate(input.startDate) ?? null;
  const endDate = parseDate(input.endDate) ?? null;
  assertDates(startDate, endDate);

  const members = cleanPlanMembers(input.members);
  // منشئ الخطة من غير المشرفين يُضاف قائداً تلقائياً — وإلا فقد إدارتها
  if (!actor.isAdmin && !members.some((m) => m.memberId === actor.memberId)) {
    members.unshift({ memberId: actor.memberId, role: "lead" });
  }
  await assertWorkspaceMembers(actor.workspaceId, members.map((m) => m.memberId));

  const goals = (input.goals ?? [])
    .map((g) => ({ title: g.title?.trim(), description: g.description?.trim() || null }))
    .filter((g): g is { title: string; description: string | null } => Boolean(g.title))
    .slice(0, 20);

  const plan = await prisma.plan.create({
    data: {
      workspaceId: actor.workspaceId,
      departmentId: department.id,
      name: name.slice(0, 120),
      description: input.description?.trim().slice(0, 2000) || null,
      status: oneOf(PLAN_STATUSES, input.status, "active"),
      startDate,
      endDate,
      createdById: actor.userId,
      members: {
        create: members.map((m) => ({ workspaceMemberId: m.memberId, role: m.role })),
      },
      goals: {
        create: goals.map((g, i) => ({
          title: g.title.slice(0, 200),
          description: g.description?.slice(0, 1000) ?? null,
          order: i,
          createdById: actor.userId,
        })),
      },
    },
    select: { id: true },
  });

  return getPlan(actor, plan.id);
}

function requireManage(access: PlanAccess) {
  if (!access.canManage) {
    throw ApiError.accessDenied("إدارة الخطة متاحة للمالك والمشرفين ورئيس القسم وقائد الخطة.");
  }
}

function requireEdit(access: PlanAccess) {
  if (!access.canEditContent) {
    throw ApiError.accessDenied("صلاحيتك في هذه الخطة لا تسمح بتعديل الأهداف والمهام.");
  }
}

export async function updatePlan(actor: Actor, id: string, input: PlanInput) {
  const { plan, access } = await getPlanWithAccess(actor, id);
  requireManage(access);

  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);
  assertDates(
    startDate === undefined ? plan.startDate : startDate,
    endDate === undefined ? plan.endDate : endDate
  );

  let departmentId: string | undefined;
  if (input.departmentId && input.departmentId !== plan.departmentId) {
    assertCanCreatePlanIn(actor, input.departmentId);
    const exists = await prisma.department.findFirst({
      where: { id: input.departmentId, workspaceId: actor.workspaceId },
      select: { id: true },
    });
    if (!exists) throw ApiError.notFound("القسم المختار غير موجود.");
    departmentId = exists.id;
  }

  const name = input.name?.trim();

  await prisma.$transaction(async (tx) => {
    await tx.plan.update({
      where: { id },
      data: {
        ...(name ? { name: name.slice(0, 120) } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim().slice(0, 2000) || null }
          : {}),
        ...(input.status ? { status: oneOf(PLAN_STATUSES, input.status, plan.status as any) } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
    });

    // نقل الخطة لقسم آخر ينقل مشاريعها معها
    if (departmentId) {
      await tx.toolRun.updateMany({ where: { planId: id }, data: { departmentId } });
    }
  });

  if (input.members) await setPlanMembers(actor, id, input.members);

  return getPlan(actor, id);
}

export async function setPlanMembers(actor: Actor, id: string, input: PlanMemberInput[]) {
  const { plan, access } = await getPlanWithAccess(actor, id);
  requireManage(access);

  const members = cleanPlanMembers(input);
  await assertWorkspaceMembers(actor.workspaceId, members.map((m) => m.memberId));

  // من يدير الخطة بصفته قائداً فقط لا يُخرج نفسه منها بالخطأ
  const managesOnlyAsLead =
    !actor.isAdmin && !actor.headOfDepartmentIds.includes(plan.departmentId);
  if (managesOnlyAsLead) {
    const self = members.find((m) => m.memberId === actor.memberId);
    if (!self || self.role !== "lead") {
      throw ApiError.invalidInput("لا يمكنك إزالة نفسك من قيادة الخطة.");
    }
  }

  await prisma.$transaction([
    prisma.planMember.deleteMany({
      where: { planId: id, workspaceMemberId: { notIn: members.map((m) => m.memberId) } },
    }),
    ...members.map((m) =>
      prisma.planMember.upsert({
        where: { planId_workspaceMemberId: { planId: id, workspaceMemberId: m.memberId } },
        create: { planId: id, workspaceMemberId: m.memberId, role: m.role },
        update: { role: m.role },
      })
    ),
  ]);

  return getPlan(actor, id);
}

export async function deletePlan(actor: Actor, id: string) {
  const { access } = await getPlanWithAccess(actor, id);
  requireManage(access);

  // المشاريع تبقى في القسم (SetNull على planId)
  await prisma.plan.delete({ where: { id } });
  return { message: "تم حذف الخطة. بقيت مشاريعها محفوظة في القسم." };
}

// ——————————————————————————————————————————————
// Goals
// ——————————————————————————————————————————————

export interface GoalInput {
  title?: string;
  description?: string | null;
  weight?: number;
  dueDate?: string | null;
  status?: string;
  order?: number;
  sourceRunId?: string | null;
}

const taskSelectForGoal = {
  id: true,
  title: true,
  status: true,
  progress: true,
  weight: true,
  dueDate: true,
} as const;

export async function listGoals(actor: Actor, planId: string) {
  await getPlanWithAccess(actor, planId);

  const goals = await prisma.planGoal.findMany({
    where: { planId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      tasks: { select: taskSelectForGoal },
      sourceRun: { select: { id: true, title: true, toolSlug: true } },
    },
  });

  return goals.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    weight: g.weight,
    dueDate: g.dueDate,
    status: g.status,
    order: g.order,
    sourceRun: g.sourceRun,
    createdAt: g.createdAt,
    tasksCount: g.tasks.length,
    tasksDone: g.tasks.filter((t) => t.status === "done").length,
    progress: goalProgress(g),
  }));
}

async function assertRunInPlanScope(actor: Actor, runId: string | null | undefined) {
  if (!runId) return null;
  await getRunWithAccess(actor, runId, "view");
  return runId;
}

export async function createGoal(actor: Actor, planId: string, input: GoalInput) {
  const { access } = await getPlanWithAccess(actor, planId);
  requireEdit(access);

  const title = input.title?.trim();
  if (!title) throw ApiError.invalidInput("عنوان الهدف مطلوب.");

  const last = await prisma.planGoal.findFirst({
    where: { planId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const goal = await prisma.planGoal.create({
    data: {
      planId,
      title: title.slice(0, 200),
      description: input.description?.trim().slice(0, 1000) || null,
      weight: Math.min(100, Math.max(1, Number(input.weight) || 1)),
      dueDate: parseDate(input.dueDate) ?? null,
      status: oneOf(GOAL_STATUSES, input.status, "not_started"),
      order: (last?.order ?? -1) + 1,
      sourceRunId: await assertRunInPlanScope(actor, input.sourceRunId),
      createdById: actor.userId,
    },
    select: { id: true },
  });

  return goal;
}

async function getGoalInPlan(planId: string, goalId: string) {
  const goal = await prisma.planGoal.findFirst({ where: { id: goalId, planId }, select: { id: true } });
  if (!goal) throw ApiError.notFound("الهدف المطلوب غير موجود.");
  return goal;
}

export async function updateGoal(actor: Actor, planId: string, goalId: string, input: GoalInput) {
  const { access } = await getPlanWithAccess(actor, planId);
  requireEdit(access);
  await getGoalInPlan(planId, goalId);

  const title = input.title?.trim();
  const dueDate = parseDate(input.dueDate);

  return prisma.planGoal.update({
    where: { id: goalId },
    data: {
      ...(title ? { title: title.slice(0, 200) } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim().slice(0, 1000) || null }
        : {}),
      ...(input.weight !== undefined
        ? { weight: Math.min(100, Math.max(1, Number(input.weight) || 1)) }
        : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(input.status ? { status: oneOf(GOAL_STATUSES, input.status, "not_started") } : {}),
      ...(input.order !== undefined ? { order: Number(input.order) || 0 } : {}),
      ...(input.sourceRunId !== undefined
        ? { sourceRunId: await assertRunInPlanScope(actor, input.sourceRunId) }
        : {}),
    },
    select: { id: true },
  });
}

export async function deleteGoal(actor: Actor, planId: string, goalId: string) {
  const { access } = await getPlanWithAccess(actor, planId);
  requireEdit(access);
  await getGoalInPlan(planId, goalId);

  // المهام تبقى في الخطة بلا هدف (SetNull) — حذف الهدف لا يمحو العمل
  await prisma.planGoal.delete({ where: { id: goalId } });
  return { message: "تم حذف الهدف." };
}

// ——————————————————————————————————————————————
// Tasks
// ——————————————————————————————————————————————

export interface TaskInput {
  goalId?: string | null;
  title?: string;
  description?: string | null;
  assigneeMemberId?: string | null;
  dueDate?: string | null;
  priority?: string;
  status?: string;
  progress?: number;
  weight?: number;
  cost?: number;
  order?: number;
}

export async function listTasks(
  actor: Actor,
  planId: string,
  filters: { goalId?: string; assignee?: string; status?: string } = {}
) {
  await getPlanWithAccess(actor, planId);

  const tasks = await prisma.planTask.findMany({
    where: {
      planId,
      ...(filters.goalId ? { goalId: filters.goalId === "none" ? null : filters.goalId } : {}),
      ...(filters.assignee
        ? { assigneeMemberId: filters.assignee === "me" ? actor.memberId : filters.assignee }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      assignee: { select: memberSelect },
      goal: { select: { id: true, title: true } },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    planId: t.planId,
    goal: t.goal,
    title: t.title,
    description: t.description,
    assignee: t.assignee ? toMember(t.assignee) : null,
    assigneeName: t.assigneeName || (t.assignee?.user?.name ?? null),
    followerName: t.followerName,
    dueDate: t.dueDate,
    priority: t.priority,
    status: t.status,
    progress: t.status === "done" ? 100 : t.progress,
    weight: t.weight,
    cost: t.cost,
    order: t.order,
    isOverdue: isOverdue(t),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

async function validateTaskRefs(actor: Actor, planId: string, input: TaskInput) {
  if (input.goalId) await getGoalInPlan(planId, input.goalId);
  if (input.assigneeMemberId) {
    await assertWorkspaceMembers(actor.workspaceId, [input.assigneeMemberId]);
  }
}

function normalizeStatusProgress(status: string | undefined, progress: number | undefined) {
  const out: { status?: string; progress?: number } = {};
  if (status) out.status = oneOf(TASK_STATUSES, status, "todo");
  if (progress !== undefined) out.progress = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));

  // تناسق الحالة والتقدّم: الإنجاز يعني 100%، والـ 100% تعني الإنجاز
  if (out.status === "done") out.progress = 100;
  else if (out.progress === 100 && !out.status) out.status = "done";
  else if (out.progress && out.progress > 0 && !out.status) out.status = "in_progress";
  return out;
}

export async function createTask(actor: Actor, planId: string, input: TaskInput) {
  const { access } = await getPlanWithAccess(actor, planId);
  requireEdit(access);

  const title = input.title?.trim();
  if (!title) throw ApiError.invalidInput("عنوان المهمة مطلوب.");
  await validateTaskRefs(actor, planId, input);

  const last = await prisma.planTask.findFirst({
    where: { planId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const sp = normalizeStatusProgress(input.status ?? "todo", input.progress ?? 0);

  return prisma.planTask.create({
    data: {
      planId,
      goalId: input.goalId || null,
      title: title.slice(0, 200),
      description: input.description?.trim().slice(0, 2000) || null,
      assigneeMemberId: input.assigneeMemberId || null,
      dueDate: parseDate(input.dueDate) ?? null,
      priority: oneOf(TASK_PRIORITIES, input.priority, "medium"),
      status: sp.status ?? "todo",
      progress: sp.progress ?? 0,
      weight: Math.min(100, Math.max(1, Number(input.weight) || 1)),
      cost: Math.max(0, Number(input.cost) || 0),
      order: (last?.order ?? -1) + 1,
      createdById: actor.userId,
    },
    select: { id: true },
  });
}

export async function updateTask(actor: Actor, planId: string, taskId: string, input: TaskInput) {
  const { access } = await getPlanWithAccess(actor, planId);

  const task = await prisma.planTask.findFirst({
    where: { id: taskId, planId },
    select: { id: true, assigneeMemberId: true },
  });
  if (!task) throw ApiError.notFound("المهمة المطلوبة غير موجودة.");

  // المكلَّف بالمهمة يحدّث حالتها وتقدّمها حتى لو لم يكن محرراً للخطة
  const isAssignee = actor.canWrite && task.assigneeMemberId === actor.memberId;
  if (!access.canEditContent) {
    const onlyProgress = Object.keys(input).every((k) => k === "status" || k === "progress");
    if (!isAssignee || !onlyProgress) requireEdit(access);
  }

  await validateTaskRefs(actor, planId, input);

  const title = input.title?.trim();
  const dueDate = parseDate(input.dueDate);
  const sp = normalizeStatusProgress(input.status, input.progress);

  return prisma.planTask.update({
    where: { id: taskId },
    data: {
      ...(input.goalId !== undefined ? { goalId: input.goalId || null } : {}),
      ...(title ? { title: title.slice(0, 200) } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim().slice(0, 2000) || null }
        : {}),
      ...(input.assigneeMemberId !== undefined
        ? { assigneeMemberId: input.assigneeMemberId || null }
        : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(input.priority ? { priority: oneOf(TASK_PRIORITIES, input.priority, "medium") } : {}),
      ...sp,
      ...(input.weight !== undefined
        ? { weight: Math.min(100, Math.max(1, Number(input.weight) || 1)) }
        : {}),
      ...(input.cost !== undefined ? { cost: Math.max(0, Number(input.cost) || 0) } : {}),
      ...(input.order !== undefined ? { order: Number(input.order) || 0 } : {}),
    },
    select: { id: true },
  });
}

export async function deleteTask(actor: Actor, planId: string, taskId: string) {
  const { access } = await getPlanWithAccess(actor, planId);
  requireEdit(access);

  const { count } = await prisma.planTask.deleteMany({ where: { id: taskId, planId } });
  if (count === 0) throw ApiError.notFound("المهمة المطلوبة غير موجودة.");
  return { message: "تم حذف المهمة." };
}

// ——————————————————————————————————————————————
// Import — تحويل مخرجات أي أداة إلى أهداف ومهام
// ——————————————————————————————————————————————

export interface ImportGoalInput {
  title: string;
  description?: string | null;
  tasks?: {
    title: string;
    description?: string | null;
    dueDate?: string | null;
    priority?: string;
    weight?: number;
    cost?: number;
    assigneeName?: string | null;
    followerName?: string | null;
  }[];
}

/**
 * مرشّحات الاستيراد من مشروع.
 * SWOT يملك أهدافاً ومهام مخزّنة فتُعاد كما هي؛ بقية الأدوات تُعيد
 * قائمة فارغة وتعتمد الواجهة على اقتراح الذكاء الاصطناعي.
 */
export async function getGoalCandidates(actor: Actor, planId: string, runId: string) {
  await getPlanWithAccess(actor, planId);
  const { run } = await getRunWithAccess(actor, runId, "view");

  if (run.toolSlug !== "swot") {
    return { source: "ai" as const, run: { id: run.id, title: run.title, toolSlug: run.toolSlug }, goals: [] };
  }

  const goals = await prisma.swotCustomGoal.findMany({
    where: { swotAnalysisId: run.id },
    orderBy: { createdAt: "asc" },
    include: { tasks: { orderBy: [{ taskIndex: "asc" }] } },
  });

  const priorityMap: Record<string, string> = { normal: "medium", medium: "medium", high: "high" };

  return {
    source: "stored" as const,
    run: { id: run.id, title: run.title, toolSlug: run.toolSlug },
    goals: goals.map((g) => ({
      title: g.goalText,
      description: null,
      tasks: g.tasks.map((t) => ({
        title: t.title,
        description: t.assignee ? `المسؤول المقترح: ${t.assignee}` : null,
        dueDate: t.dueDate.toISOString(),
        priority: priorityMap[t.priority] ?? "medium",
        weight: t.weight,
        cost: t.cost,
        assigneeName: t.assignee,
        followerName: t.follower,
      })),
    })),
  };
}

export async function importGoals(
  actor: Actor,
  planId: string,
  input: { sourceRunId?: string | null; goals: ImportGoalInput[] }
) {
  const { access } = await getPlanWithAccess(actor, planId);
  requireEdit(access);

  const sourceRunId = await assertRunInPlanScope(actor, input.sourceRunId);
  const goals = (input.goals ?? []).filter((g) => g?.title?.trim()).slice(0, 30);
  if (goals.length === 0) throw ApiError.invalidInput("اختر هدفاً واحداً على الأقل للاستيراد.");

  const [lastGoal, lastTask] = await Promise.all([
    prisma.planGoal.findFirst({ where: { planId }, orderBy: { order: "desc" }, select: { order: true } }),
    prisma.planTask.findFirst({ where: { planId }, orderBy: { order: "desc" }, select: { order: true } }),
  ]);
  let goalOrder = (lastGoal?.order ?? -1) + 1;
  let taskOrder = (lastTask?.order ?? -1) + 1;

  await prisma.$transaction(
    goals.map((g) =>
      prisma.planGoal.create({
        data: {
          planId,
          title: g.title.trim().slice(0, 200),
          description: g.description?.trim().slice(0, 1000) || null,
          order: goalOrder++,
          sourceRunId,
          createdById: actor.userId,
          tasks: {
            create: (g.tasks ?? [])
              .filter((t) => t?.title?.trim())
              .slice(0, 30)
              .map((t) => ({
                planId,
                title: t.title.trim().slice(0, 200),
                description: t.description?.trim().slice(0, 2000) || null,
                dueDate: parseDate(t.dueDate) ?? null,
                priority: oneOf(TASK_PRIORITIES, t.priority, "medium"),
                weight: Math.min(100, Math.max(1, Number(t.weight) || 1)),
                cost: Math.max(0, Number(t.cost) || 0),
                assigneeName: t.assigneeName || null,
                followerName: t.followerName || null,
                order: taskOrder++,
                createdById: actor.userId,
              })),
          },
        },
      })
    )
  );

  return { imported: goals.length };
}
