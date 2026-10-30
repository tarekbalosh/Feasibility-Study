import { describe, it, expect } from "vitest";
import { type Actor } from "../src/services/accessService";
import { buildHomeDashboard, type HomeDashboardInput, type SwotGoalInput } from "../src/services/homeBuilder";

const mkActor = (over: Partial<Actor>): Actor => ({
  userId: "u-user",
  workspaceId: "ws-1",
  memberId: "m-user",
  role: "member",
  isAdmin: false,
  canWrite: true,
  departmentIds: ["dep-tech"],
  headOfDepartmentIds: [],
  planIds: ["p-1"],
  ...over,
});

const admin = mkActor({
  userId: "u-admin",
  memberId: "m-admin",
  role: "owner",
  isAdmin: true,
  departmentIds: ["dep-tech", "dep-sales"],
});

const deptHead = mkActor({
  userId: "u-head",
  memberId: "m-head",
  departmentIds: ["dep-tech"],
  headOfDepartmentIds: ["dep-tech"],
});

const memberA = mkActor({
  userId: "u-memberA",
  memberId: "m-memberA",
  departmentIds: ["dep-tech"],
});

const memberB = mkActor({
  userId: "u-memberB",
  memberId: "m-memberB",
  departmentIds: ["dep-sales"],
});

const newMember = mkActor({
  userId: "u-newMember",
  memberId: "m-newMember",
  departmentIds: [],
});

const mockWsMembers = [
  { id: "m-admin", email: "admin@corp.com", role: "owner", user: { id: "u-admin", name: "المدير العام" } },
  { id: "m-head", email: "head@corp.com", role: "member", user: { id: "u-head", name: "رئيس التقنية" } },
  { id: "m-memberA", email: "userA@corp.com", role: "member", user: { id: "u-memberA", name: "أحمد عضو أ" } },
  { id: "m-memberB", email: "userB@corp.com", role: "member", user: { id: "u-memberB", name: "سالم عضو ب" } },
  { id: "m-newMember", email: "new@corp.com", role: "member", user: { id: "u-newMember", name: "عضو جديد" } },
];

const mockDepartments = [
  { id: "dep-tech", name: "تقنية المعلومات", color: "#6366f1", icon: null, _count: { members: 3 } },
  { id: "dep-sales", name: "المبيعات", color: "#10b981", icon: null, _count: { members: 2 } },
];

const mockPlans = [
  {
    id: "p-1",
    name: "خطة الربع الأول",
    status: "active",
    endDate: new Date("2026-12-31"),
    departmentId: "dep-tech",
    department: { id: "dep-tech", name: "تقنية المعلومات", color: "#6366f1", icon: null },
    members: [],
    _count: { members: 3, goals: 2 },
    tasks: [],
  },
];

const fixedNow = new Date("2026-06-15T12:00:00Z").getTime();

// 3 أهداف:
// هدف 1 في قسم التقنية (فيه مهمة لـ A ومهمة لـ B)
// هدف 2 في قسم التقنية (فيه مهمة لـ A ومهمة لـ head)
// هدف 3 في قسم المبيعات (فيه مهمة لـ B فقط وميزانية ضخمة 50,000)
const mockGoals: SwotGoalInput[] = [
  {
    id: "g-1",
    goalText: "تطوير البنية السحابية",
    toolRun: { id: "tr-1", title: "تحليل سوات للتقنية", departmentId: "dep-tech", planId: "p-1" },
    tasks: [
      {
        id: "t-1",
        goalId: "g-1",
        title: "إعداد الخوادم",
        dueDate: new Date("2026-03-01"),
        assignee: "m-memberA",
        follower: "m-head",
        weight: 60,
        cost: 10000,
        currency: "SAR",
        priority: "high",
        status: "completed",
        progress: 100,
        budgetDistribution: { monthly: [0, 10000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      },
      {
        id: "t-2",
        goalId: "g-1",
        title: "تأمين الشبكات",
        dueDate: new Date("2026-05-01"), // قبل تاريخ fixedNow وغير منجزة = متأخرة
        assignee: "m-memberB",
        follower: "m-admin",
        weight: 40,
        cost: 5000,
        currency: "SAR",
        priority: "medium",
        status: "in_progress",
        progress: 40,
        budgetDistribution: { monthly: [0, 0, 0, 0, 5000, 0, 0, 0, 0, 0, 0, 0] },
      },
    ],
  },
  {
    id: "g-2",
    goalText: "تطوير الواجهة الرقمية",
    toolRun: { id: "tr-2", title: "مشروع الواجهة", departmentId: "dep-tech", planId: "p-1" },
    tasks: [
      {
        id: "t-3",
        goalId: "g-2",
        title: "تصميم واجهة المستخدم",
        dueDate: new Date("2026-08-01"), // بعد fixedNow
        assignee: "m-memberA",
        follower: "m-head",
        weight: 50,
        cost: 15000,
        currency: "SAR",
        priority: "medium",
        status: "in_progress",
        progress: 50,
        budgetDistribution: { monthly: [0, 0, 0, 0, 0, 0, 0, 15000, 0, 0, 0, 0] },
      },
      {
        id: "t-4",
        goalId: "g-2",
        title: "اعتماد المعايير",
        dueDate: new Date("2026-09-01"),
        assignee: "m-head",
        follower: "m-admin",
        weight: 50,
        cost: 2000,
        currency: "SAR",
        priority: "normal",
        status: "not_started",
        progress: 0,
        budgetDistribution: { monthly: [0, 0, 0, 0, 0, 0, 0, 0, 2000, 0, 0, 0] },
      },
    ],
  },
  {
    id: "g-3",
    goalText: "حملة المبيعات الكبرى",
    toolRun: { id: "tr-3", title: "مشروع المبيعات", departmentId: "dep-sales", planId: null },
    tasks: [
      {
        id: "t-5",
        goalId: "g-3",
        title: "إطلاق الإعلانات الممولة",
        dueDate: new Date("2026-07-01"),
        assignee: "m-memberB",
        follower: "m-admin",
        weight: 100,
        cost: 50000,
        currency: "SAR",
        priority: "high",
        status: "in_progress",
        progress: 20,
        budgetDistribution: { monthly: [0, 0, 0, 0, 0, 0, 50000, 0, 0, 0, 0, 0] },
      },
    ],
  },
];

function runDashboard(actor: Actor) {
  const currentMember = mockWsMembers.find((m) => m.id === actor.memberId) || null;
  return buildHomeDashboard({
    actor,
    currentMember: currentMember as any,
    departments: mockDepartments,
    plans: mockPlans,
    projectsCount: 3,
    recentProjects: [],
    wsMembersCount: mockWsMembers.length,
    wsMembers: mockWsMembers,
    goals: mockGoals,
    now: fixedNow,
  });
}

describe("صلاحيات لوحة التحكم الرئيسية والرسم البياني الدائري", () => {
  it("المدير يرى كل المهام وكل الموازنة ومجموع المسؤولين", () => {
    const res = runDashboard(admin);

    // إجمالي المهام = 5
    expect(res.taskStatus.total).toBe(5);
    expect(res.taskStatus.hasData).toBe(true);

    // مجموع شرائح حلقة حالة المهام يطابق الإجمالي تماماً
    const sumSegments = res.taskStatus.segments.reduce((acc, s) => acc + s.count, 0);
    expect(sumSegments).toBe(5);

    // تجميع الحالات للمدير:
    // t-1: completed
    // t-2: overdue (due 2026-05-01 < 2026-06-15)
    // t-3: in_progress
    // t-4: not_started
    // t-5: in_progress
    const segMap = Object.fromEntries(res.taskStatus.segments.map((s) => [s.key, s.count]));
    expect(segMap.completed).toBe(1);
    expect(segMap.overdue).toBe(1);
    expect(segMap.inProgress).toBe(2);
    expect(segMap.notStarted).toBe(1);

    // الميزانية: 10000 + 5000 + 15000 + 2000 + 50000 = 82000
    const sarBudget = res.budgetYear.byCurrency.find((c) => c.currency === "SAR");
    expect(sarBudget?.total).toBe(82000);

    // قسم المسؤولين يحوي جميع المسؤولين الذين لديهم مهام
    expect(res.workloadByAssignee.length).toBeGreaterThan(1);
  });

  it("الموظف (عضو أ) يرى فقط مهامه وميزانيته الخاصة ولا يرى أي مسؤول سواه", () => {
    const resA = runDashboard(memberA);

    // عضو أ له مهمتان فقط: t-1 و t-3
    expect(resA.taskStatus.total).toBe(2);
    const taskIds = resA.taskStatus.segments.flatMap((s) => s.tasks.map((t) => t.id));
    expect(taskIds.sort()).toEqual(["t-1", "t-3"]);

    // تجميع حالة مهام أ: 1 منجزة (t-1)، 1 قيد الإنجاز (t-3)، 0 متأخرة، 0 لم تبدأ
    const segMapA = Object.fromEntries(resA.taskStatus.segments.map((s) => [s.key, s.count]));
    expect(segMapA.completed).toBe(1);
    expect(segMapA.inProgress).toBe(1);
    expect(segMapA.overdue).toBe(0);
    expect(segMapA.notStarted).toBe(0);

    // ميزانية عضو أ: 10000 + 15000 = 25000 فقط
    const sarBudgetA = resA.budgetYear.byCurrency.find((c) => c.currency === "SAR");
    expect(sarBudgetA?.total).toBe(25000);

    // في قسم المسؤولين: يرى نفسه فقط!
    expect(resA.workloadByAssignee).toHaveLength(1);
    expect(resA.workloadByAssignee[0].name).toBe("أحمد عضو أ");
    expect(resA.workloadByAssignee[0].total).toBe(2);

    // بطاقة أعضاء مساحة العمل للعضو = 1 (نفسه)
    expect(resA.stats.members).toBe(1);
  });

  it("الموظف (عضو ب) يرى مهامه المختلفة (t-2 و t-5) ولا يرى مهام أ", () => {
    const resB = runDashboard(memberB);

    // عضو ب له مهمتان: t-2 و t-5
    expect(resB.taskStatus.total).toBe(2);
    const taskIds = resB.taskStatus.segments.flatMap((s) => s.tasks.map((t) => t.id));
    expect(taskIds.sort()).toEqual(["t-2", "t-5"]);

    // t-2 متأخرة، t-5 قيد الإنجاز
    const segMapB = Object.fromEntries(resB.taskStatus.segments.map((s) => [s.key, s.count]));
    expect(segMapB.overdue).toBe(1);
    expect(segMapB.inProgress).toBe(1);
    expect(segMapB.completed).toBe(0);

    // ميزانية عضو ب: 5000 + 50000 = 55000
    const sarBudgetB = resB.budgetYear.byCurrency.find((c) => c.currency === "SAR");
    expect(sarBudgetB?.total).toBe(55000);

    // في قسم المسؤولين: يرى سالم عضو ب فقط
    expect(resB.workloadByAssignee).toHaveLength(1);
    expect(resB.workloadByAssignee[0].name).toBe("سالم عضو ب");
  });

  it("عدم تسريب أي معلومات أو أرقام بين الأعضاء", () => {
    const resA = runDashboard(memberA);
    const jsonA = JSON.stringify(resA);

    // ميزانية ب (50000) وعنوان مهمة ب وعنوان هدفه لا تظهر لعضو أ
    expect(jsonA).not.toContain("إطلاق الإعلانات الممولة");
    expect(jsonA).not.toContain("سالم عضو ب");
    expect(jsonA).not.toContain("حملة المبيعات الكبرى");
    expect(jsonA).not.toContain("50000");
  });

  it("عضو جديد لا يملك مهاماً بعد: تظهر نفس الصفحة بحالة فارغة آمنة دون أخطاء", () => {
    const resNew = runDashboard(newMember);

    expect(resNew.taskStatus.total).toBe(0);
    expect(resNew.taskStatus.hasData).toBe(false);
    expect(resNew.goalsProgress.totalGoals).toBe(0);
    expect(resNew.goalsProgress.hasData).toBe(false);
    expect(resNew.budgetYear.hasData).toBe(false);

    // في قسم المسؤولين يرى نفسه مع 0 مهام دون تسريب غيره
    expect(resNew.workloadByAssignee).toHaveLength(1);
    expect(resNew.workloadByAssignee[0].name).toBe("عضو جديد");
    expect(resNew.workloadByAssignee[0].total).toBe(0);
    expect(resNew.workloadByAssignee[0].tasks).toEqual([]);
  });

  it("مجموع مهام الشرائح يطابق القوائم ومجموع شهور الميزانية يطابق إجمالي السنة", () => {
    const res = runDashboard(admin);

    // مجموع الشرائح يطابق إجمالي المهام
    const sliceSum = res.taskStatus.segments.reduce((acc, s) => acc + s.count, 0);
    expect(sliceSum).toBe(res.taskStatus.total);

    // مجموع المهام الموجودة بداخل المصفوفات يطابق الإجمالي
    const totalTasksInLists = res.taskStatus.segments.reduce((acc, s) => acc + s.tasks.length, 0);
    expect(totalTasksInLists).toBe(res.taskStatus.total);

    // ميزانية الشهور الـ 12 تطابق تماماً إجمالي السنة
    const sar = res.budgetYear.byCurrency.find((c) => c.currency === "SAR")!;
    const monthlySum = sar.monthly.reduce((acc, m) => acc + m.amount, 0);
    expect(monthlySum).toBe(sar.total);
  });
});

describe("بطاقات الأرقام: الخطط النشطة والأعضاء ونسبة الإنجاز", () => {
  const salesPlan = {
    ...mockPlans[0],
    id: "p-2",
    name: "خطة سرية للمبيعات",
    departmentId: "dep-sales",
    department: { id: "dep-sales", name: "المبيعات", color: "#10b981", icon: null },
  };

  function run(actor: Actor, over: Partial<HomeDashboardInput> = {}) {
    const currentMember = mockWsMembers.find((m) => m.id === actor.memberId) || null;
    return buildHomeDashboard({
      actor,
      currentMember: currentMember as any,
      departments: actor.isAdmin ? mockDepartments : mockDepartments.filter((d) => actor.departmentIds.includes(d.id)),
      plans: actor.isAdmin ? [...mockPlans, salesPlan] : mockPlans,
      projectsCount: 0,
      recentProjects: [],
      wsMembersCount: mockWsMembers.length,
      wsMembers: mockWsMembers,
      goals: mockGoals,
      now: fixedNow,
      ...over,
    });
  }

  it("المدير يرى كل الخطط النشطة وكل الأعضاء، والرقم يطابق القائمة", () => {
    const res = run(admin, { visibleMembers: mockWsMembers });
    expect(res.activePlansList).toHaveLength(2);
    expect(res.stats.activePlans).toBe(res.activePlansList.length);
    expect(res.stats.members).toBe(5);
    expect(res.membersPreview).toHaveLength(5);
    expect(res.visibleMemberUserIds).not.toContain("u-admin");
  });

  it("العضو يرى أعضاء أقسامه فقط ولا تسرّب أسماء غيرهم", () => {
    const visible = mockWsMembers.filter((m) => ["m-memberA", "m-head"].includes(m.id));
    const res = run(memberA, { visibleMembers: visible });
    expect(res.stats.members).toBe(2);
    expect(res.membersPreview.map((m) => m.id).sort()).toEqual(["m-head", "m-memberA"]);
    const json = JSON.stringify(res);
    expect(json).not.toContain("سالم عضو ب");
    expect(json).not.toContain("المدير العام");
    expect(json).not.toContain("userB@corp.com");
  });

  it("لا تُسرّب لون أو اسم قسم لا ينتمي إليه العضو عبر شريحة خطة", () => {
    const res = run(memberA, { plans: [mockPlans[0], salesPlan] });
    const sales = res.activePlansList.find((p) => p.id === "p-2")!;
    expect(sales.color).toBeNull();
    expect(Object.keys(sales)).not.toContain("department");
    expect(JSON.stringify(res.activePlansList)).not.toContain("المبيعات");
  });

  it("نسب الأقسام مرتبة تنازلياً وتشمل فقط الأقسام المسموحة", () => {
    const resAdmin = run(admin);
    const values = resAdmin.departmentsProgress.map((d) => d.progress);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(resAdmin.departmentsProgress).toHaveLength(2);

    const resA = run(memberA);
    expect(resA.departmentsProgress.map((d) => d.id)).toEqual(["dep-tech"]);
  });
});
