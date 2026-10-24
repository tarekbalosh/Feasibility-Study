import { describe, it, expect } from "vitest";
import { computePlanAccess, type Actor } from "../src/services/accessService";
import {
  buildSheet,
  type SheetGoalInput,
  type SheetPlanInput,
  type SheetTaskInput,
} from "../src/services/sheetBuilder";
import { applyFilters } from "../src/services/sheetService";

// ثلاثة مستخدمين بأدوار مختلفة على الخطة نفسها
const mk = (over: Partial<Actor>): Actor => ({
  userId: "u",
  workspaceId: "ws",
  memberId: "m",
  role: "member",
  isAdmin: false,
  canWrite: true,
  departmentIds: ["dep1"],
  headOfDepartmentIds: [],
  planIds: [],
  ...over,
});

const admin = mk({ userId: "u-admin", memberId: "m-admin", role: "owner", isAdmin: true, departmentIds: [] });
const head = mk({ userId: "u-head", memberId: "m-head", headOfDepartmentIds: ["dep1"] });
const employee = mk({ userId: "u-emp", memberId: "m-emp" });

const planRow = { id: "p1", workspaceId: "ws", departmentId: "dep1", members: [] };
const plan: SheetPlanInput = {
  id: "p1",
  name: "website",
  status: "active",
  department: { id: "dep1", name: "البرمجة" },
};

const goals: SheetGoalInput[] = [
  { id: "g1", title: "هدف 1", weight: 1, order: 0, status: "in_progress", referenceType: "kpi", referenceDetail: "2 مليون", sourceRun: null },
  { id: "g2", title: "هدف 2", weight: 1, order: 1, status: "not_started", referenceType: null, referenceDetail: "قلة المحترفين", sourceRun: { id: "r1", title: "test", toolSlug: "swot" } },
  { id: "g3", title: "هدف سري", weight: 1, order: 2, status: "not_started", referenceType: null, referenceDetail: null, sourceRun: null },
];

const t = (id: string, goalId: string, o: Partial<SheetTaskInput>): SheetTaskInput => ({
  id,
  goalId,
  title: `وسيلة ${id}`,
  assigneeMemberId: null,
  assigneeName: null,
  followerMemberId: null,
  followerName: null,
  assignee: null,
  follower: null,
  dueDate: null,
  priority: "medium",
  status: "todo",
  progress: 0,
  weight: 50,
  cost: 1000,
  need: null,
  party: null,
  order: 0,
  ...o,
});

const tasks: SheetTaskInput[] = [
  t("a", "g1", { assigneeMemberId: "m-emp", progress: 100, status: "done", cost: 1000, order: 0 }),
  t("b", "g1", { assigneeMemberId: "m-other", cost: 2000, order: 1 }),
  t("c", "g2", { followerMemberId: "m-emp", progress: 50, status: "in_progress", cost: 500, order: 0 }),
  t("d", "g3", { assigneeMemberId: "m-other", cost: 99999, order: 0 }),
];

const run = (actor: Actor, input: SheetTaskInput[] = tasks) =>
  buildSheet({
    actor,
    access: computePlanAccess(actor, planRow),
    plan,
    goals,
    tasks: input,
  });

describe("صلاحيات الجدول الشامل", () => {
  it("مدير النظام يرى كل الصفوف والموازنة الكاملة", () => {
    const s = run(admin);
    expect(s.scope).toBe("all");
    expect(s.rows.map((r) => r.taskId).sort()).toEqual(["a", "b", "c", "d"]);
    expect(s.totals.budget).toBe(1000 + 2000 + 500 + 99999);
  });

  it("رئيس القسم يرى كل صفوف قسمه", () => {
    const s = run(head);
    expect(s.scope).toBe("all");
    expect(s.rows).toHaveLength(4);
  });

  it("الموظف يرى وسائله فقط (مسؤول أو معني بالمتابعة)", () => {
    const s = run(employee);
    expect(s.scope).toBe("assigned");
    expect(s.rows.map((r) => r.taskId).sort()).toEqual(["a", "c"]);
  });

  it("لا يسرّب الموظف أهدافاً أو أرقاماً من صفوف مخفية", () => {
    const s = run(employee);
    const json = JSON.stringify(s);
    expect(s.rows.some((r) => r.goalId === "g3")).toBe(false);
    expect(json).not.toContain("هدف سري");
    expect(json).not.toContain("99999");
    // الموازنة من صفوفه فقط، وإنجاز الهدف من وسيلته الظاهرة فقط (a = 100%) لا من b
    expect(s.totals.budget).toBe(1500);
    expect(s.rows.find((r) => r.taskId === "a")!.goalProgress).toBe(100);
  });

  it("الخادم يُسقط صفوفاً زائدة حتى لو مرّرها المستدعي (دفاع ثانٍ)", () => {
    const s = run(employee, tasks); // الحمولة تحوي كل المهام
    expect(s.rows.map((r) => r.taskId)).not.toContain("b");
    expect(s.rows.map((r) => r.taskId)).not.toContain("d");
  });

  it("موظف بلا أي وسيلة لا يرى أي صف", () => {
    const nobody = mk({ userId: "u-x", memberId: "m-nobody" });
    const s = run(nobody);
    expect(s.rows).toEqual([]);
    expect(s.totals.budget).toBe(0);
  });

  it("صلاحية التعديل: المحرر الكامل مقابل المسؤول (إنجاز فقط) مقابل المتابع (قراءة)", () => {
    expect(run(admin).rows[0].canEdit).toBe(true);
    const emp = run(employee).rows;
    expect(emp.find((r) => r.taskId === "a")).toMatchObject({ canEdit: false, canEditProgress: true });
    expect(emp.find((r) => r.taskId === "c")).toMatchObject({ canEdit: false, canEditProgress: false });
  });

  it("المُطّلع (viewer) لا يعدّل شيئاً حتى لو كان مسؤولاً", () => {
    const viewer = mk({ userId: "u-v", memberId: "m-emp", role: "viewer", canWrite: false });
    const rows = run(viewer).rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.canEdit && !r.canEditProgress)).toBe(true);
  });

  it("الفلاتر تُعيد حساب المجموع ودمج المجموعات على الصفوف الباقية فقط", () => {
    const s = applyFilters(run(admin), { status: "completed" });
    expect(s.rows.map((r) => r.taskId)).toEqual(["a"]);
    expect(s.rows[0].groupSize).toBe(1);
    expect(s.totals.budget).toBe(1000);
  });

  it("تجميع الأهداف: أول صف فقط يحمل rowSpan بحجم المجموعة", () => {
    const s = run(admin);
    const g1 = s.rows.filter((r) => r.goalId === "g1");
    expect(g1.map((r) => r.isGroupStart)).toEqual([true, false]);
    expect(g1[0].groupSize).toBe(2);
    // إنجاز الهدف مرجّح بالأوزان: (100*50 + 0*50) / 100 = 50
    expect(g1[0].goalProgress).toBe(50);
  });

  it("تتضمن كل صفوف الجدول معرّف الخطة واسمها لدعم العرض المجمّع", () => {
    const s = run(admin);
    expect(s.rows.length).toBeGreaterThan(0);
    expect(s.rows.every((r) => r.planId === "p1" && r.planName === "website")).toBe(true);
  });
});
