import ExcelJS from "exceljs";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { type Actor, type PlanAccess, computePlanAccess, getPlanWithAccess, planListWhere } from "./accessService";
import { memberSelect, toMember } from "./orgHelpers";
import {
  buildSheet,
  type SheetGoalInput,
  type SheetResult,
  type SheetRow,
  type SheetTaskInput,
} from "./sheetBuilder";

// ——————————————————————————————————————————————
// sheetService — بيانات «الجدول الشامل» للخطة وتصديرها إلى Excel
// ——————————————————————————————————————————————

export interface SheetFilters {
  q?: string;
  departmentId?: string;
  assignee?: string;
  status?: string;
  importance?: string;
}

const memberBrief = (m: Parameters<typeof toMember>[0] | null | undefined) =>
  m ? { id: m.id, name: toMember(m).name } : null;

export async function getPlanSheet(
  actor: Actor,
  planId: string,
  filters: SheetFilters = {}
): Promise<SheetResult> {
  const { plan, access } = await getPlanWithAccess(actor, planId);
  return applyFilters(await loadPlanSheet(actor, plan, access), filters);
}

export interface WorkspaceSheet {
  plan: null;
  plans: {
    id: string;
    name: string;
    departmentId: string;
    departmentName: string;
    canEditContent: boolean;
    members: { id: string; name: string }[];
  }[];
  rows: SheetRow[];
  totals: SheetResult["totals"];
  scope: "all" | "assigned";
  access: { canEditContent: boolean };
}

/**
 * الجدول المجمّع لكل الخطط في كل الأقسام التي يراها المستخدم.
 * كل خطة تمرّ بنفس بوابة الصلاحيات (planListWhere + buildSheet)، فالخطط التي
 * لا يملك فيها المستخدم أي صف لا تظهر، والمجاميع تُحسب على المرئي فقط.
 */
export async function getWorkspaceSheet(
  actor: Actor,
  filters: SheetFilters = {}
): Promise<WorkspaceSheet> {
  const plans = await prisma.plan.findMany({
    where: planListWhere(actor),
    include: {
      members: { select: { workspaceMemberId: true, role: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: [{ department: { name: "asc" } }, { createdAt: "asc" }],
  });

  const rows: SheetRow[] = [];
  const planMetas: WorkspaceSheet["plans"] = [];
  let offset = 0;
  let seesAll = false;

  for (const plan of plans) {
    const access = computePlanAccess(actor, plan);
    if (!access.canView) continue;

    const sheet = await loadPlanSheet(actor, plan, access, plan.department);
    if (sheet.rows.length === 0) continue; // قسم/خطة بلا صفوف مرئية لا تظهر
    if (access.canManage) seesAll = true;

    const maxGroup = Math.max(...sheet.rows.map((r) => r.groupIndex));
    for (const r of sheet.rows) rows.push({ ...r, groupIndex: r.groupIndex + offset });
    offset += maxGroup + 1;

    let members: { id: string; name: string }[] = [];
    if (access.canEditContent) {
      const pm = await prisma.planMember.findMany({
        where: { planId: plan.id },
        include: { workspaceMember: { select: memberSelect } },
      });
      members = pm.map((m) => ({ id: m.workspaceMember.id, name: toMember(m.workspaceMember).name }));
    }
    planMetas.push({
      id: plan.id,
      name: plan.name,
      departmentId: plan.department.id,
      departmentName: plan.department.name,
      canEditContent: access.canEditContent,
      members,
    });
  }

  const filtered = applyFilters(
    {
      rows,
      totals: { budget: 0, rows: 0, goals: 0 },
    },
    filters
  );

  return {
    plan: null,
    plans: planMetas,
    rows: filtered.rows,
    totals: filtered.totals,
    scope: seesAll ? "all" : "assigned",
    access: { canEditContent: planMetas.some((p) => p.canEditContent) },
  };
}

async function loadPlanSheet(
  actor: Actor,
  plan: { id: string; name: string; status: string; departmentId: string },
  access: PlanAccess,
  knownDepartment?: { id: string; name: string }
): Promise<SheetResult> {
  const planId = plan.id;
  const department =
    knownDepartment ??
    (await prisma.department.findUnique({
      where: { id: plan.departmentId },
      select: { id: true, name: true },
    }));
  if (!department) throw ApiError.notFound("قسم الخطة غير موجود.");

  // الفلترة عند الاستعلام نفسه: الصفوف غير المصرّح بها لا تُحمَّل أصلاً
  const rawTasks = await prisma.planTask.findMany({
    where: {
      planId,
      ...(access.canManage
        ? {}
        : {
            OR: [{ assigneeMemberId: actor.memberId }, { followerMemberId: actor.memberId }],
          }),
    },
    include: {
      assignee: { select: memberSelect },
      follower: { select: memberSelect },
    },
  });

  const visibleGoalIds = Array.from(
    new Set(rawTasks.map((t) => t.goalId).filter((id): id is string => Boolean(id)))
  );

  const rawGoals = await prisma.planGoal.findMany({
    where: {
      planId,
      ...(access.canManage ? {} : { id: { in: visibleGoalIds } }),
    },
    include: { sourceRun: { select: { id: true, title: true, toolSlug: true } } },
  });

  const goals: SheetGoalInput[] = rawGoals.map((g) => ({
    id: g.id,
    title: g.title,
    weight: g.weight,
    order: g.order,
    status: g.status,
    referenceType: g.referenceType,
    referenceDetail: g.referenceDetail,
    sourceRun: g.sourceRun,
  }));

  const tasks: SheetTaskInput[] = rawTasks.map((t) => ({
    id: t.id,
    goalId: t.goalId,
    title: t.title,
    assigneeMemberId: t.assigneeMemberId,
    assigneeName: t.assigneeName,
    followerMemberId: t.followerMemberId,
    followerName: t.followerName,
    assignee: memberBrief(t.assignee),
    follower: memberBrief(t.follower),
    dueDate: t.dueDate,
    priority: t.priority,
    status: t.status,
    progress: t.progress,
    weight: t.weight,
    cost: t.cost,
    need: t.need,
    party: t.party,
    order: t.order,
  }));

  return buildSheet({
    actor,
    access,
    plan: { id: plan.id, name: plan.name, status: plan.status, department },
    goals,
    tasks,
  });
}

/**
 * فلاتر العرض تُطبَّق بعد الصلاحيات، وتُعاد أرقام المجاميع على ما يبقى ظاهراً
 * حتى يطابق «مجموع الموازنة» الصفوف المعروضة والمُصدَّرة.
 */
export function applyFilters<T extends { rows: SheetRow[]; totals: SheetResult["totals"] }>(
  sheet: T,
  f: SheetFilters
): T {
  const q = f.q?.trim().toLowerCase();
  const rows = sheet.rows.filter((r) => {
    if (f.departmentId && r.departmentId !== f.departmentId) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.importance && r.importance !== f.importance) return false;
    if (f.assignee && r.assignee?.id !== f.assignee && r.assigneeName !== f.assignee) return false;
    if (q) {
      const hay = [r.goalTitle, r.meansTitle, r.referenceDetail, r.assigneeName, r.followerName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // إعادة حساب التجميع بعد الفلترة (rowSpan يجب أن يطابق الصفوف الباقية)
  const sizes = new Map<number, number>();
  rows.forEach((r) => sizes.set(r.groupIndex, (sizes.get(r.groupIndex) ?? 0) + 1));
  const seen = new Set<number>();
  const regrouped: SheetRow[] = rows.map((r) => {
    const start = !seen.has(r.groupIndex);
    seen.add(r.groupIndex);
    return { ...r, isGroupStart: start, groupSize: sizes.get(r.groupIndex) ?? 1 };
  });

  return {
    ...sheet,
    rows: regrouped,
    totals: {
      budget: regrouped.reduce((s, r) => s + r.budget, 0),
      rows: regrouped.length,
      goals: new Set(regrouped.map((r) => r.goalId).filter(Boolean)).size,
    },
  };
}

const REF_LABEL: Record<string, string> = { kpi: "KPIs", swot: "SWOT", need: "الاحتياج" };
const STATUS_LABEL: Record<string, string> = {
  completed: "أنجزت",
  overdue: "متأخرة",
  in_progress: "قيد الإنجاز",
  not_started: "لم تبدأ",
};
const IMPORTANCE_LABEL: Record<string, string> = { normal: "عادية", medium: "متوسطة", high: "عالية" };

const HEADERS = [
  "الإدارة / القسم",
  "المرجع",
  "تفصيل المرجع",
  "الهدف",
  "المهمة",
  "وزنها النسبي",
  "المسؤول",
  "المعني بالمتابعة",
  "الأهمية",
  "الحالة",
  "نسبة الإنجاز",
  "نسبة إنجاز الهدف",
  "الموازنة",
];

const GROUP_COLORS = ["FFF3F9D2", "FFD9F0DF", "FFD6EAF8", "FFFDE8D4", "FFEADCF4", "FFFCE4E4"];

/** ملف xlsx يطابق الجدول الظاهر للمستخدم تماماً (نفس الصفوف والترتيب والمجموع) */
export async function exportPlanSheet(
  actor: Actor,
  planId: string | null,
  filters: SheetFilters = {}
): Promise<{ buffer: Buffer; filename: string }> {
  const sheet = planId
    ? await getPlanSheet(actor, planId, filters)
    : await getWorkspaceSheet(actor, filters);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("الخطة التشغيلية", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });

  ws.columns = HEADERS.map((h, i) => ({ header: h, key: String(i), width: i === 3 || i === 4 ? 30 : 16 }));

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  head.height = 28;
  head.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
  });

  for (const r of sheet.rows) {
    const row = ws.addRow([
      r.departmentName,
      r.referenceType ? REF_LABEL[r.referenceType] : "",
      r.referenceDetail ?? "",
      r.goalTitle ?? "",
      r.meansTitle ?? "",
      r.weight === null ? "" : r.weight / 100,
      r.assigneeName ?? "",
      r.followerName ?? "",
      r.importance ? IMPORTANCE_LABEL[r.importance] : "",
      r.status ? STATUS_LABEL[r.status] : "",
      r.progress === null ? "" : r.progress / 100,
      r.goalProgress / 100,
      r.budget,
    ]);
    const color = GROUP_COLORS[r.groupIndex % GROUP_COLORS.length];
    row.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    row.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
      c.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
    row.getCell(6).numFmt = "0%";
    row.getCell(11).numFmt = "0%";
    row.getCell(12).numFmt = "0%";
    row.getCell(13).numFmt = "#,##0";
  }

  // الدمج الرأسي لخلايا المجموعة (القسم/المرجع/التفصيل/الهدف/نسبة الهدف)
  let cursor = 2;
  const mergeCols = [1, 2, 3, 4, 12];
  for (const r of sheet.rows) {
    if (r.isGroupStart && r.groupSize > 1) {
      for (const col of mergeCols) ws.mergeCells(cursor, col, cursor + r.groupSize - 1, col);
    }
    cursor++;
  }

  const total = ws.addRow(Array(13).fill(""));
  total.getCell(1).value = "مجموع الموازنة";
  total.getCell(13).value = sheet.totals.budget;
  total.getCell(13).numFmt = "#,##0";
  total.font = { bold: true };
  total.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
    c.alignment = { horizontal: "center" };
  });
  ws.mergeCells(total.number, 1, total.number, 12);

  const out = await wb.xlsx.writeBuffer();
  return { buffer: Buffer.from(out as ArrayBuffer), filename: `plan-${planId ?? "all"}.xlsx` };
}
