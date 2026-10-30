import { type Actor } from "./accessService";
import { memberSelect, toMember, weightedProgress } from "./orgHelpers";

export interface TaskItemDetail {
  id: string;
  title: string;
  dueDate: string | null;
  progress: number;
  priority: string;
  cost: number;
  currency: string;
  assignee: string;
  follower: string;
  state: "completed" | "inProgress" | "notStarted" | "overdue";
  goalText: string;
}

export interface TaskStatusSegment {
  key: "completed" | "inProgress" | "notStarted" | "overdue";
  label: string;
  count: number;
  percentage: number;
  color: string;
  tasks: TaskItemDetail[];
}

export interface MonthBudgetDetail {
  monthIndex: number;
  monthName: string;
  amount: number;
  percentage: number;
}

export interface CurrencyBudgetDetail {
  currency: string;
  total: number;
  tasksCount: number;
  monthly: MonthBudgetDetail[];
}

export interface GoalProgressSegment {
  key: "completed" | "inProgress" | "notStarted";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AssigneeWorkload {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  tasks: { title: string; state: string; progress: number }[];
}

export const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export interface SwotTaskInput {
  id: string;
  goalId: string;
  title: string;
  dueDate: Date | null;
  assignee: string;
  follower: string;
  weight: number;
  cost: number;
  currency: string;
  priority: string;
  status: string;
  progress: number;
  budgetDistribution?: any;
}

export interface SwotGoalInput {
  id: string;
  goalText: string;
  toolRun: {
    id: string;
    title: string;
    departmentId: string | null;
    planId: string | null;
  };
  tasks: SwotTaskInput[];
}

export interface HomeDashboardInput {
  actor: Actor;
  currentMember: {
    id: string;
    email: string;
    role: string;
    user: { id: string; name: string } | null;
  } | null;
  departments: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    _count: { members: number };
  }[];
  plans: {
    id: string;
    name: string;
    status: string;
    endDate: Date | null;
    departmentId: string;
    department: { id: string; name: string; color: string | null; icon: string | null } | null;
    members: { workspaceMember: any }[];
    _count: { members: number; goals: number };
    tasks: { weight: number; progress: number; status: string; dueDate: Date | null }[];
  }[];
  projectsCount: number;
  recentProjects: any[];
  wsMembersCount: number;
  wsMembers: any[];
  goals: SwotGoalInput[];
  /**
   * الأعضاء الفعّالون الذين يحق للمستخدم رؤيتهم (المدير: الكل، غيره: أعضاء أقسامه ونفسه).
   * إن لم تُمرَّر نعرض العضو الحالي فقط حفاظاً على الخصوصية.
   */
  visibleMembers?: any[];
  now?: number;
}

export function buildHomeDashboard(input: HomeDashboardInput) {
  const {
    actor,
    currentMember,
    departments,
    plans,
    projectsCount,
    recentProjects,
    wsMembersCount,
    wsMembers,
    goals,
    visibleMembers,
    now = Date.now(),
  } = input;

  const memberName = currentMember ? toMember(currentMember as any).name : "المستخدم";

  // تجميع كل المعرّفات المحتملة للعضو الحالي للمطابقة الدقيقة
  const actorIdentifiers = new Set<string>();
  actorIdentifiers.add(actor.memberId);
  if (actor.userId) actorIdentifiers.add(actor.userId);
  if (currentMember?.user?.name) {
    const n = currentMember.user.name.trim();
    actorIdentifiers.add(n);
    actorIdentifiers.add(n.toLowerCase());
  }
  if (currentMember?.email) {
    const e = currentMember.email.trim();
    actorIdentifiers.add(e);
    actorIdentifiers.add(e.toLowerCase());
  }

  const matchesActor = (val: string | null | undefined): boolean => {
    if (!val) return false;
    const s = val.trim();
    return actorIdentifiers.has(s) || actorIdentifiers.has(s.toLowerCase());
  };

  const isDeptHead = !actor.isAdmin && actor.headOfDepartmentIds.length > 0;
  const isRegularMember = !actor.isAdmin && !isDeptHead;

  // خريطة أسماء أعضاء مساحة العمل
  const memberNames = new Map(wsMembers.map((m) => [m.id, toMember(m).name]));

  // تصفية الأهداف والمهام بنطاق أمني صارم
  type ScopedGoal = {
    goalId: string;
    goalText: string;
    weight: number;
    tasks: SwotTaskInput[];
  };

  const scopedGoals: ScopedGoal[] = [];
  const scopedTasks: (SwotTaskInput & { goalText: string; departmentId: string | null })[] = [];

  for (const g of goals) {
    let filteredTasks: SwotTaskInput[] = [];

    if (actor.isAdmin) {
      filteredTasks = g.tasks;
    } else if (isDeptHead) {
      const isGoalInHeadDept = g.toolRun.departmentId && actor.headOfDepartmentIds.includes(g.toolRun.departmentId);
      filteredTasks = g.tasks.filter((t) => isGoalInHeadDept || matchesActor(t.assignee) || matchesActor(t.follower));
    } else {
      // العضو العادي: مهامه هو فقط (مسؤول أو معني بالمتابعة)
      filteredTasks = g.tasks.filter((t) => matchesActor(t.assignee) || matchesActor(t.follower));
    }

    if (filteredTasks.length > 0) {
      scopedGoals.push({
        goalId: g.id,
        goalText: g.goalText,
        weight: 1,
        tasks: filteredTasks,
      });

      for (const t of filteredTasks) {
        scopedTasks.push({ ...t, goalText: g.goalText, departmentId: g.toolRun.departmentId });
      }
    } else if (actor.isAdmin || (isDeptHead && g.toolRun.departmentId && actor.headOfDepartmentIds.includes(g.toolRun.departmentId))) {
      // للمدير أو مدير القسم: هدف فارغ بدون مهام يظهر
      scopedGoals.push({
        goalId: g.id,
        goalText: g.goalText,
        weight: 1,
        tasks: [],
      });
    }
  }

  // 1) حلقة حالة المهام
  const taskGroups: Record<"completed" | "inProgress" | "notStarted" | "overdue", TaskItemDetail[]> = {
    completed: [],
    inProgress: [],
    notStarted: [],
    overdue: [],
  };

  for (const t of scopedTasks) {
    const isDone = t.status === "completed" || t.progress === 100;
    const isLate = !isDone && (t.status === "overdue" || (t.dueDate && t.dueDate.getTime() < now));

    let state: "completed" | "inProgress" | "notStarted" | "overdue";
    if (isDone) state = "completed";
    else if (isLate) state = "overdue";
    else if (t.status === "in_progress" || t.progress > 0) state = "inProgress";
    else state = "notStarted";

    const assigneeDisplayName = memberNames.get(t.assignee) || t.assignee || "غير محدد";
    const followerDisplayName = memberNames.get(t.follower) || t.follower || "غير محدد";

    taskGroups[state].push({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      progress: t.progress,
      priority: t.priority,
      cost: t.cost,
      currency: t.currency || "SAR",
      assignee: assigneeDisplayName,
      follower: followerDisplayName,
      state,
      goalText: t.goalText,
    });
  }

  const totalTasks = scopedTasks.length;
  const taskStatusSegments: TaskStatusSegment[] = [
    {
      key: "completed",
      label: "أُنجزت",
      count: taskGroups.completed.length,
      percentage: totalTasks > 0 ? Math.round((taskGroups.completed.length / totalTasks) * 100) : 0,
      color: "#10b981", // emerald-500
      tasks: taskGroups.completed,
    },
    {
      key: "inProgress",
      label: "قيد الإنجاز",
      count: taskGroups.inProgress.length,
      percentage: totalTasks > 0 ? Math.round((taskGroups.inProgress.length / totalTasks) * 100) : 0,
      color: "#3b82f6", // blue-500
      tasks: taskGroups.inProgress,
    },
    {
      key: "notStarted",
      label: "لم تبدأ",
      count: taskGroups.notStarted.length,
      percentage: totalTasks > 0 ? Math.round((taskGroups.notStarted.length / totalTasks) * 100) : 0,
      color: "#94a3b8", // slate-400
      tasks: taskGroups.notStarted,
    },
    {
      key: "overdue",
      label: "متأخرة",
      count: taskGroups.overdue.length,
      percentage: totalTasks > 0 ? Math.round((taskGroups.overdue.length / totalTasks) * 100) : 0,
      color: "#ef4444", // red-500
      tasks: taskGroups.overdue,
    },
  ];

  // 2) حلقة ميزانية السنة (12 شهر)
  const byCurrency = new Map<string, { monthly: number[]; total: number; tasks: number }>();

  for (const t of scopedTasks) {
    if (t.cost <= 0) continue;
    const cur = t.currency || "SAR";
    const entry = byCurrency.get(cur) ?? { monthly: Array(12).fill(0), total: 0, tasks: 0 };

    const dist = t.budgetDistribution as { monthly?: unknown } | null;
    const monthlyDist = Array.isArray(dist?.monthly) ? (dist!.monthly as unknown[]) : null;

    if (monthlyDist && monthlyDist.length === 12) {
      for (let i = 0; i < 12; i++) {
        const v = Number(monthlyDist[i]) || 0;
        entry.monthly[i] += v;
        entry.total += v;
      }
    } else if (t.dueDate) {
      const month = new Date(t.dueDate).getMonth();
      entry.monthly[month] += t.cost;
      entry.total += t.cost;
    } else {
      entry.monthly[0] += t.cost;
      entry.total += t.cost;
    }

    entry.tasks += 1;
    byCurrency.set(cur, entry);
  }

  const currencies = Array.from(byCurrency.keys());
  if (currencies.length === 0) {
    currencies.push("SAR");
  }

  const currencyBudgetList: CurrencyBudgetDetail[] = currencies.map((cur) => {
    const data = byCurrency.get(cur) ?? { monthly: Array(12).fill(0), total: 0, tasks: 0 };
    const monthDetails: MonthBudgetDetail[] = data.monthly.map((amt, idx) => ({
      monthIndex: idx,
      monthName: MONTH_NAMES[idx],
      amount: Math.round(amt),
      percentage: data.total > 0 ? Math.round((amt / data.total) * 100) : 0,
    }));

    return {
      currency: cur,
      total: Math.round(data.total),
      tasksCount: data.tasks,
      monthly: monthDetails,
    };
  });

  const defaultCurrency = currencies.includes("SAR") ? "SAR" : currencies[0];
  const totalBudgetAcrossAll = currencyBudgetList.reduce((acc, c) => acc + c.total, 0);

  const budgetByMonthSeries = currencyBudgetList.map((c) => ({
    currency: c.currency,
    monthly: c.monthly.map((m) => m.amount),
    total: c.total,
    tasks: c.tasksCount,
  }));

  // 3) حلقة إنجاز الأهداف
  let completedGoalsCount = 0;
  let inProgressGoalsCount = 0;
  let notStartedGoalsCount = 0;

  for (const g of scopedGoals) {
    if (g.tasks.length === 0) {
      notStartedGoalsCount += 1;
      continue;
    }

    let gWeight = 0;
    let gWeightedDone = 0;
    for (const t of g.tasks) {
      const w = Math.max(1, t.weight || 1);
      const isDone = t.status === "completed" || t.progress === 100;
      gWeight += w;
      gWeightedDone += w * (isDone ? 100 : Math.min(100, Math.max(0, t.progress)));
    }

    const gProgress = gWeight > 0 ? Math.round(gWeightedDone / gWeight) : 0;
    if (gProgress >= 100) {
      completedGoalsCount += 1;
    } else if (gProgress > 0) {
      inProgressGoalsCount += 1;
    } else {
      notStartedGoalsCount += 1;
    }
  }

  const totalGoals = scopedGoals.length;

  let totalTasksWeight = 0;
  let totalTasksWeightedProgress = 0;
  for (const t of scopedTasks) {
    const w = Math.max(1, t.weight || 1);
    const prog = t.status === "completed" || t.progress === 100 ? 100 : Math.min(100, Math.max(0, t.progress));
    totalTasksWeight += w;
    totalTasksWeightedProgress += w * prog;
  }

  const overallProgressPercentage = totalTasksWeight > 0
    ? Math.round(totalTasksWeightedProgress / totalTasksWeight)
    : 0;

  const goalsProgressSegments: GoalProgressSegment[] = [
    {
      key: "completed",
      label: "أهداف مكتملة",
      count: completedGoalsCount,
      percentage: totalGoals > 0 ? Math.round((completedGoalsCount / totalGoals) * 100) : 0,
      color: "#10b981",
    },
    {
      key: "inProgress",
      label: "قيد التنفيذ",
      count: inProgressGoalsCount,
      percentage: totalGoals > 0 ? Math.round((inProgressGoalsCount / totalGoals) * 100) : 0,
      color: "#3b82f6",
    },
    {
      key: "notStarted",
      label: "لم تبدأ",
      count: notStartedGoalsCount,
      percentage: totalGoals > 0 ? Math.round((notStartedGoalsCount / totalGoals) * 100) : 0,
      color: "#94a3b8",
    },
  ];

  // 4) قسم توزيع المهام على المسؤولين
  const workloadMap = new Map<string, AssigneeWorkload>();

  if (isRegularMember) {
    // للعضو العادي: نفسه فقط!
    const memberEntry: AssigneeWorkload = {
      name: memberName,
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      tasks: [],
    };

    for (const t of scopedTasks) {
      const isDone = t.status === "completed" || t.progress === 100;
      const isLate = !isDone && (t.status === "overdue" || (t.dueDate && t.dueDate.getTime() < now));

      let state: "completed" | "inProgress" | "notStarted" | "overdue";
      if (isDone) state = "completed";
      else if (isLate) state = "overdue";
      else if (t.status === "in_progress" || t.progress > 0) state = "inProgress";
      else state = "notStarted";

      memberEntry.total += 1;
      memberEntry[state] += 1;
      memberEntry.tasks.push({ title: t.title, state, progress: t.progress });
    }

    workloadMap.set(memberName, memberEntry);
  } else {
    for (const t of scopedTasks) {
      const key = t.assignee || "غير مُسندة";
      const name = memberNames.get(key) ?? key;
      const e = workloadMap.get(name) ?? {
        name,
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        overdue: 0,
        tasks: [],
      };

      const isDone = t.status === "completed" || t.progress === 100;
      const isLate = !isDone && (t.status === "overdue" || (t.dueDate && t.dueDate.getTime() < now));

      let state: "completed" | "inProgress" | "notStarted" | "overdue";
      if (isDone) state = "completed";
      else if (isLate) state = "overdue";
      else if (t.status === "in_progress" || t.progress > 0) state = "inProgress";
      else state = "notStarted";

      e.total += 1;
      e[state] += 1;
      e.tasks.push({ title: t.title, state, progress: t.progress });
      workloadMap.set(name, e);
    }
  }

  const workloadByAssignee = Array.from(workloadMap.values()).sort((a, b) => b.total - a.total);

  // 5) بطاقات الأرقام
  const activePlans = plans.filter((p) => p.status === "active");

  // الأعضاء المسموح برؤيتهم: الرقم والصور يخرجان من القائمة نفسها فيتطابقان دائماً
  const visibleList: ReturnType<typeof toMember>[] | null = visibleMembers
    ? visibleMembers.map((m) => toMember(m))
    : null;

  const stats = {
    departments: isRegularMember ? actor.departmentIds.length : departments.length,
    plans: plans.length,
    activePlans: activePlans.length,
    members: visibleList
      ? visibleList.length
      : isRegularMember ? 1 : (isDeptHead ? Math.max(1, departments.reduce((acc, d) => acc + d._count.members, 0)) : wsMembersCount),
    projects: projectsCount,
    tasks: totalTasks,
    progress: overallProgressPercentage,
  };

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

  // بطاقة الخطط النشطة: كل الخطط النشطة المسموحة فقط. لون القسم يُرسل فقط إن كان القسم ضمن
  // الأقسام المسموحة للعضو، وإلا يبقى null (نقطة محايدة) ولا يُرسل اسم القسم إطلاقاً.
  const deptColorById = new Map(departments.map((d) => [d.id, d.color]));
  const activePlansList = activePlans.map((p) => ({
    id: p.id,
    name: p.name,
    progress: weightedProgress(p.tasks),
    color: deptColorById.get(p.departmentId) ?? null,
  }));

  // بطاقة نسبة الإنجاز: نسبة كل قسم من نفس المهام المحسوبة في الرقم الكلي، مرتبة تنازلياً
  const deptProgressAcc = new Map<string, { w: number; done: number }>();
  for (const t of scopedTasks) {
    if (!t.departmentId) continue;
    const w = Math.max(1, t.weight || 1);
    const prog = t.status === "completed" || t.progress === 100 ? 100 : Math.min(100, Math.max(0, t.progress));
    const acc = deptProgressAcc.get(t.departmentId) ?? { w: 0, done: 0 };
    acc.w += w;
    acc.done += w * prog;
    deptProgressAcc.set(t.departmentId, acc);
  }
  const departmentsProgress = departments
    .map((d) => {
      const acc = deptProgressAcc.get(d.id);
      return {
        id: d.id,
        name: d.name,
        color: d.color,
        progress: acc && acc.w > 0 ? Math.round(acc.done / acc.w) : 0,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  // بطاقة الأعضاء: أول 5 للعرض + معرّفات كل الظاهرين لحساب المتصلين في الواجهة
  const fallbackSelf = currentMember ? [toMember(currentMember as any)] : [];
  const memberList = visibleList ?? fallbackSelf;
  const membersPreview = memberList.slice(0, 5).map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.name,
    workspaceRole: m.workspaceRole,
    isSelf: m.id === actor.memberId,
  }));
  const visibleMemberUserIds = memberList
    .filter((m) => m.userId && m.id !== actor.memberId)
    .map((m) => m.userId as string);

  return {
    taskStatus: {
      total: totalTasks,
      hasData: totalTasks > 0,
      segments: taskStatusSegments,
    },
    budgetYear: {
      currencies,
      defaultCurrency,
      hasData: totalBudgetAcrossAll > 0,
      byCurrency: currencyBudgetList,
    },
    goalsProgress: {
      totalGoals,
      overallProgress: overallProgressPercentage,
      hasData: totalGoals > 0,
      segments: goalsProgressSegments,
    },
    stats,
    budgetByMonth: budgetByMonthSeries,
    workloadByAssignee,
    departments: departmentCards,
    plans: planCards,
    activePlansList,
    departmentsProgress,
    membersPreview,
    visibleMemberUserIds,
    recentProjects,
  };
}
