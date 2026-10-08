import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

// ——————————————————————————————————————————————
// orgHelpers — أدوات مشتركة بين خدمات الأقسام والخطط
// ——————————————————————————————————————————————

/** الشكل الموحّد لعضو يُعرض في الواجهة */
export const memberSelect = {
  id: true,
  email: true,
  role: true,
  user: { select: { id: true, name: true } },
} as const;

export type MemberRow = {
  id: string;
  email: string;
  role: string;
  user: { id: string; name: string } | null;
};

export function toMember(m: MemberRow) {
  return {
    id: m.id,
    userId: m.user?.id ?? null,
    name: m.user?.name || m.email.split("@")[0],
    email: m.email,
    workspaceRole: m.role,
  };
}

/**
 * يتحقق أن كل المعرّفات أعضاء فعّالون في المساحة — يمنع ربط عضو من
 * مساحة أخرى بقسم أو خطة عبر نداء مباشر على الـ API.
 */
export async function assertWorkspaceMembers(workspaceId: string, memberIds: string[]) {
  const unique = Array.from(new Set(memberIds));
  if (unique.length === 0) return unique;

  const count = await prisma.workspaceMember.count({
    where: { id: { in: unique }, workspaceId, status: "active" },
  });

  if (count !== unique.length) {
    throw ApiError.invalidInput("بعض الأعضاء المختارين ليسوا أعضاء فعّالين في مساحة العمل.");
  }

  return unique;
}

/** نسبة إنجاز موزونة — المهمة المنجزة تُحتسب 100% مهما كان رقم تقدّمها */
export function weightedProgress(
  tasks: { weight: number; progress: number; status: string }[]
): number {
  if (tasks.length === 0) return 0;
  let total = 0;
  let done = 0;
  for (const t of tasks) {
    const w = Math.max(1, t.weight || 1);
    total += w;
    done += w * (t.status === "done" ? 100 : Math.min(100, Math.max(0, t.progress)));
  }
  return Math.round(done / total);
}

/** إنجاز الهدف: من مهامه إن وُجدت، وإلا من حالته */
export function goalProgress(goal: {
  status: string;
  tasks: { weight: number; progress: number; status: string }[];
}): number {
  if (goal.tasks.length > 0) return weightedProgress(goal.tasks);
  return goal.status === "completed" ? 100 : 0;
}

export function isOverdue(task: { dueDate: Date | null; status: string }): boolean {
  return Boolean(task.dueDate && task.status !== "done" && task.dueDate.getTime() < Date.now());
}

export function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) throw ApiError.invalidInput("صيغة التاريخ غير صحيحة.");
  return d;
}
