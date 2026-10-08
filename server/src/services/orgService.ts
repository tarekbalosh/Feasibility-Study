import { prisma } from "../config/prisma";
import {
  type Actor,
  departmentListWhere,
  planListWhere,
  projectListWhere,
} from "./accessService";
import { isOverdue, memberSelect, toMember, weightedProgress } from "./orgHelpers";

// ——————————————————————————————————————————————
// orgService — سياق المستخدم، والأعضاء، ومؤشرات لوحة الإدارة
// ——————————————————————————————————————————————

/** ما تحتاجه الواجهة لتقرّر ما تعرضه — الحماية الفعلية تبقى على الخادم */
export async function getMyContext(actor: Actor) {
  const departments = await prisma.department.findMany({
    where: { id: { in: actor.departmentIds } },
    select: { id: true, name: true, color: true, icon: true },
    orderBy: { name: "asc" },
  });

  return {
    memberId: actor.memberId,
    role: actor.role,
    isAdmin: actor.isAdmin,
    canWrite: actor.canWrite,
    departments: departments.map((d) => ({
      ...d,
      isHead: actor.headOfDepartmentIds.includes(d.id),
    })),
    canCreatePlans: actor.isAdmin || (actor.canWrite && actor.headOfDepartmentIds.length > 0),
  };
}

/** الأعضاء الفعّالون مع أقسامهم وأحمال مهامهم — لمنتقي الأعضاء وصفحة الأعضاء */
export async function listOrgMembers(actor: Actor) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: actor.workspaceId, status: "active" },
    orderBy: { joinedAt: "asc" },
    select: {
      ...memberSelect,
      joinedAt: true,
      departmentMemberships: {
        select: { role: true, department: { select: { id: true, name: true, color: true } } },
      },
      planMemberships: { select: { planId: true } },
      assignedTasks: { select: { status: true, dueDate: true } },
    },
  });

  return members.map((m) => ({
    ...toMember(m),
    joinedAt: m.joinedAt,
    departments: m.departmentMemberships.map((d) => ({ ...d.department, departmentRole: d.role })),
    plansCount: m.planMemberships.length,
    openTasks: m.assignedTasks.filter((t) => t.status !== "done").length,
    overdueTasks: m.assignedTasks.filter(isOverdue).length,
  }));
}

/** لوحة الإدارة — كل الأرقام محصورة بما يحق للفاعل رؤيته */
export async function getOverview(actor: Actor) {
  const [departments, plans, projectsCount, recentProjects, membersCount, myTasks] =
    await Promise.all([
      prisma.department.findMany({
        where: departmentListWhere(actor),
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.plan.findMany({
        where: planListWhere(actor),
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
          departmentId: true,
          department: { select: { id: true, name: true, color: true, icon: true } },
          members: {
            take: 5,
            select: { workspaceMember: { select: memberSelect } },
          },
          _count: { select: { members: true, goals: true } },
          tasks: { select: { weight: true, progress: true, status: true, dueDate: true } },
        },
      }),
      prisma.toolRun.count({ where: projectListWhere(actor) }),
      prisma.toolRun.findMany({
        where: projectListWhere(actor),
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          toolSlug: true,
          updatedAt: true,
          user: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, color: true } },
          plan: { select: { id: true, name: true } },
        },
      }),
      prisma.workspaceMember.count({ where: { workspaceId: actor.workspaceId, status: "active" } }),
      prisma.planTask.findMany({
        where: { assigneeMemberId: actor.memberId, status: { not: "done" } },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          progress: true,
          plan: { select: { id: true, name: true } },
        },
      }),
    ]);

  // توزيع التكلفة الشهري لكل مهام الأهداف (SWOT) — مجمَّعاً حسب العملة
  const swotTasks = await prisma.swotTask.findMany({
    where: { cost: { gt: 0 }, goal: { toolRun: projectListWhere(actor) } },
    select: {
      cost: true,
      currency: true,
      budgetDistribution: true,
    },
  });
  const workloadTasks = await prisma.swotTask.findMany({
    where: { goal: { toolRun: projectListWhere(actor) } },
    select: { title: true, assignee: true, status: true, progress: true, dueDate: true },
  });
  const wsMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: actor.workspaceId },
    select: memberSelect,
  });
  const memberNames = new Map(wsMembers.map((m) => [m.id, toMember(m).name]));
  const workloadMap = new Map<
    string,
    { name: string; total: number; completed: number; inProgress: number; notStarted: number; overdue: number; tasks: { title: string; state: string; progress: number }[] }
  >();
  for (const t of workloadTasks) {
    const key = t.assignee || "غير مُسندة";
    const name = memberNames.get(key) ?? key;
    const e = workloadMap.get(name) ?? {
      name, total: 0, completed: 0, inProgress: 0, notStarted: 0, overdue: 0, tasks: [],
    };
    const late = t.status !== "completed" && t.dueDate.getTime() < Date.now();
    let state: "completed" | "overdue" | "inProgress" | "notStarted";
    if (t.status === "completed") state = "completed";
    else if (late || t.status === "overdue") state = "overdue";
    else if (t.status === "in_progress" || t.progress > 0) state = "inProgress";
    else state = "notStarted";
    e.total += 1;
    e[state] += 1;
    e.tasks.push({ title: t.title, state, progress: t.progress });
    workloadMap.set(name, e);
  }
  const workloadByAssignee = [...workloadMap.values()].sort((a, b) => b.total - a.total);
  const byCurrency = new Map<string, { monthly: number[]; total: number; tasks: number }>();
  for (const t of swotTasks) {
    const dist = t.budgetDistribution as { monthly?: unknown } | null;
    const monthly = Array.isArray(dist?.monthly) ? (dist!.monthly as unknown[]) : null;
    if (!monthly) continue;
    const entry = byCurrency.get(t.currency) ?? { monthly: Array(12).fill(0), total: 0, tasks: 0 };
    for (let i = 0; i < 12; i++) {
      const v = Number(monthly[i]) || 0;
      entry.monthly[i] += v;
      entry.total += v;
    }
    entry.tasks += 1;
    byCurrency.set(t.currency, entry);
  }
  const budgetByMonth = [...byCurrency.entries()]
    .map(([currency, v]) => ({ currency, ...v }))
    .sort((a, b) => b.total - a.total);

  const allTasks = plans.flatMap((p) => p.tasks);
  const activePlans = plans.filter((p) => p.status === "active");

  const planCards = plans.slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    endDate: p.endDate,
    department: p.department,
    membersCount: p._count.members,
    members: p.members.map((m) => toMember(m.workspaceMember)),
    goalsCount: p._count.goals,
    tasksCount: p.tasks.length,
    tasksDone: p.tasks.filter((t) => t.status === "done").length,
    progress: weightedProgress(p.tasks),
  }));

  const departmentCards = departments.map((d) => {
    const deptPlans = plans.filter((p) => p.departmentId === d.id);
    const tasks = deptPlans.flatMap((p) => p.tasks);
    return {
      id: d.id,
      name: d.name,
      color: d.color,
      icon: d.icon,
      membersCount: d._count.members,
      plansCount: deptPlans.length,
      progress: weightedProgress(tasks),
    };
  });

  return {
    stats: {
      departments: departments.length,
      plans: plans.length,
      activePlans: activePlans.length,
      members: membersCount,
      projects: projectsCount,
      tasks: allTasks.length,
      tasksDone: allTasks.filter((t) => t.status === "done").length,
      tasksOverdue: allTasks.filter(isOverdue).length,
      progress: weightedProgress(activePlans.flatMap((p) => p.tasks)),
    },
    plans: planCards,
    departments: departmentCards,
    recentProjects,
    budgetByMonth,
    workloadByAssignee,
    myTasks: myTasks.map((t) => ({ ...t, isOverdue: isOverdue(t) })),
  };
}
