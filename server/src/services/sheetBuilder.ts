import type { Actor, PlanAccess } from "./accessService";

// ——————————————————————————————————————————————
// sheetBuilder — يحوّل أهداف الخطة ومهامها إلى صفوف جدول مسطّحة
// ——————————————————————————————————————————————
//  قواعد الرؤية (تُفرض هنا في الخادم، لا في الواجهة):
//   • مالك/مشرف المساحة، رئيس القسم، قائد الخطة (canManage) → كل الصفوف.
//   • غير ذلك → الوسائل التي هو «مسؤولها» أو «المعني بمتابعتها» فقط.
//  نسبة إنجاز الهدف ومجموع الموازنة تُحسبان من الصفوف المرئية فقط، فلا
//  يتسرّب رقم من صف مخفي.
// ——————————————————————————————————————————————

export type SheetStatus = "completed" | "overdue" | "in_progress" | "not_started";
export type SheetImportance = "normal" | "medium" | "high";
export type SheetReferenceType = "kpi" | "swot" | "need" | null;

export interface SheetMember {
  id: string;
  name: string;
}

export interface SheetGoalInput {
  id: string;
  title: string;
  weight: number;
  order: number;
  status: string;
  referenceType: string | null;
  referenceDetail: string | null;
  sourceRun: { id: string; title: string; toolSlug: string } | null;
}

export interface SheetTaskInput {
  id: string;
  goalId: string | null;
  title: string;
  assigneeMemberId: string | null;
  assigneeName: string | null;
  followerMemberId: string | null;
  followerName: string | null;
  assignee: SheetMember | null;
  follower: SheetMember | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  progress: number;
  weight: number;
  cost: number;
  need: string | null;
  party: string | null;
  order: number;
}

export interface SheetPlanInput {
  id: string;
  name: string;
  status: string;
  department: { id: string; name: string };
}

export interface SheetRow {
  /** معرّف ثابت للصف: المهمة، أو الهدف إن لم تكن له وسائل */
  rowId: string;
  planId: string;
  planName: string;
  taskId: string | null;
  goalId: string | null;
  /** أول صف في مجموعة الهدف — تُدمج عنده الخلايا (rowSpan) */
  isGroupStart: boolean;
  groupSize: number;
  groupIndex: number;
  departmentId: string;
  departmentName: string;
  referenceType: SheetReferenceType;
  referenceDetail: string | null;
  sourceRun: { id: string; title: string; toolSlug: string } | null;
  goalTitle: string | null;
  goalProgress: number;
  meansTitle: string | null;
  weight: number | null;
  assignee: SheetMember | null;
  assigneeName: string | null;
  follower: SheetMember | null;
  followerName: string | null;
  importance: SheetImportance | null;
  status: SheetStatus | null;
  progress: number | null;
  need: string | null;
  party: string | null;
  dueDate: string | null;
  budget: number;
  /** تعديل كل الحقول */
  canEdit: boolean;
  /** تعديل الحالة والإنجاز فقط (المسؤول عن المهمة) */
  canEditProgress: boolean;
}

export interface SheetResult {
  plan: { id: string; name: string; status: string; department: { id: string; name: string } };
  rows: SheetRow[];
  totals: { budget: number; rows: number; goals: number };
  scope: "all" | "assigned";
  access: PlanAccess;
}

const REFERENCE_TYPES = ["kpi", "swot", "need"] as const;

export function mapStatus(task: { status: string; dueDate: Date | null }, now: number): SheetStatus {
  if (task.status === "done") return "completed";
  if (task.dueDate && task.dueDate.getTime() < now) return "overdue";
  if (task.status === "in_progress" || task.status === "review") return "in_progress";
  return "not_started";
}

export function mapImportance(priority: string): SheetImportance {
  if (priority === "high" || priority === "urgent") return "high";
  if (priority === "medium") return "medium";
  return "normal";
}

function resolveReference(goal: SheetGoalInput): SheetReferenceType {
  if ((REFERENCE_TYPES as readonly string[]).includes(goal.referenceType ?? "")) {
    return goal.referenceType as SheetReferenceType;
  }
  if (goal.sourceRun?.toolSlug?.toLowerCase().includes("swot")) return "swot";
  return null;
}

function taskProgress(t: { status: string; progress: number }) {
  return t.status === "done" ? 100 : Math.min(100, Math.max(0, t.progress));
}

/** إنجاز موزون على الوسائل المرئية فقط */
export function weightedOf(tasks: { weight: number; status: string; progress: number }[]): number {
  if (tasks.length === 0) return 0;
  let total = 0;
  let done = 0;
  for (const t of tasks) {
    const w = Math.max(1, t.weight || 1);
    total += w;
    done += w * taskProgress(t);
  }
  return Math.round(done / total);
}

export function isTaskVisible(actor: Actor, access: PlanAccess, task: SheetTaskInput): boolean {
  if (access.canManage) return true;
  return task.assigneeMemberId === actor.memberId || task.followerMemberId === actor.memberId;
}

export function buildSheet(params: {
  actor: Actor;
  access: PlanAccess;
  plan: SheetPlanInput;
  goals: SheetGoalInput[];
  tasks: SheetTaskInput[];
  now?: number;
}): SheetResult {
  const { actor, access, plan, goals, tasks } = params;
  const now = params.now ?? Date.now();
  const seesAll = access.canManage;

  // طبقة دفاع ثانية: حتى لو مرّر المستدعي صفوفاً زائدة تُسقَط هنا
  const visibleTasks = tasks.filter((t) => isTaskVisible(actor, access, t));

  const byGoal = new Map<string, SheetTaskInput[]>();
  const orphans: SheetTaskInput[] = [];
  for (const t of visibleTasks) {
    if (t.goalId && goals.some((g) => g.id === t.goalId)) {
      const list = byGoal.get(t.goalId) ?? [];
      list.push(t);
      byGoal.set(t.goalId, list);
    } else {
      orphans.push(t);
    }
  }

  const sortTasks = (a: SheetTaskInput, b: SheetTaskInput) => a.order - b.order;
  const rows: SheetRow[] = [];
  let groupIndex = 0;

  const toRow = (
    t: SheetTaskInput,
    goal: SheetGoalInput | null,
    meta: { start: boolean; size: number; idx: number; goalProgress: number }
  ): SheetRow => {
    const isAssignee = actor.canWrite && t.assigneeMemberId === actor.memberId;
    return {
      rowId: t.id,
      planId: plan.id,
      planName: plan.name,
      taskId: t.id,
      goalId: goal?.id ?? null,
      isGroupStart: meta.start,
      groupSize: meta.size,
      groupIndex: meta.idx,
      departmentId: plan.department.id,
      departmentName: plan.department.name,
      referenceType: goal ? resolveReference(goal) : null,
      referenceDetail: goal?.referenceDetail ?? null,
      sourceRun: goal?.sourceRun ?? null,
      goalTitle: goal?.title ?? null,
      goalProgress: meta.goalProgress,
      meansTitle: t.title,
      weight: t.weight,
      assignee: t.assignee,
      assigneeName: t.assigneeName || t.assignee?.name || null,
      follower: t.follower,
      followerName: t.followerName || t.follower?.name || null,
      importance: mapImportance(t.priority),
      status: mapStatus(t, now),
      progress: taskProgress(t),
      need: t.need,
      party: t.party,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      budget: t.cost || 0,
      canEdit: access.canEditContent,
      canEditProgress: access.canEditContent || isAssignee,
    };
  };

  const ordered = [...goals].sort((a, b) => a.order - b.order);
  for (const goal of ordered) {
    const list = (byGoal.get(goal.id) ?? []).sort(sortTasks);

    if (list.length === 0) {
      // هدف بلا وسائل مرئية: يظهر لمن يرى الكل فقط، فلا يكشف الموظفُ أهدافاً لا تخصه
      if (!seesAll) continue;
      rows.push({
        rowId: `goal:${goal.id}`,
        planId: plan.id,
        planName: plan.name,
        taskId: null,
        goalId: goal.id,
        isGroupStart: true,
        groupSize: 1,
        groupIndex: groupIndex++,
        departmentId: plan.department.id,
        departmentName: plan.department.name,
        referenceType: resolveReference(goal),
        referenceDetail: goal.referenceDetail,
        sourceRun: goal.sourceRun,
        goalTitle: goal.title,
        goalProgress: goal.status === "completed" ? 100 : 0,
        meansTitle: null,
        weight: null,
        assignee: null,
        assigneeName: null,
        follower: null,
        followerName: null,
        importance: null,
        status: null,
        progress: null,
        need: null,
        party: null,
        dueDate: null,
        budget: 0,
        canEdit: access.canEditContent,
        canEditProgress: false,
      });
      continue;
    }

    const goalProgress = weightedOf(list);
    const idx = groupIndex++;
    list.forEach((t, i) =>
      rows.push(toRow(t, goal, { start: i === 0, size: list.length, idx, goalProgress }))
    );
  }

  // وسائل بلا هدف: كل منها مجموعة مستقلة
  for (const t of orphans.sort(sortTasks)) {
    rows.push(
      toRow(t, null, {
        start: true,
        size: 1,
        idx: groupIndex++,
        goalProgress: taskProgress(t),
      })
    );
  }

  return {
    plan,
    rows,
    totals: {
      budget: rows.reduce((s, r) => s + r.budget, 0),
      rows: rows.length,
      goals: new Set(rows.map((r) => r.goalId).filter(Boolean)).size,
    },
    scope: seesAll ? "all" : "assigned",
    access,
  };
}
