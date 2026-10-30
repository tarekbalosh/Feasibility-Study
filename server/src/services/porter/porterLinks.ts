/**
 * ─────────────────────────────────────────────────────────────
 *  Porter Links Pure Utilities — أدوات نقية لإدارة ربط بنود قوى بورتر
 * ─────────────────────────────────────────────────────────────
 */

import {
  type PorterForceKey,
  type PorterFieldKey,
  PORTER_FORCES,
  MAX_FIELD_CHARS,
} from "./porterConstants";

export interface LinkedPorterFactorInput {
  force: PorterForceKey;
  content: string;
  positiveImplication: string;
  negativeImplication: string;
  positiveSource?: "manual" | "ai" | "ai_edited";
  negativeSource?: "manual" | "ai" | "ai_edited";
}

export interface PorterFieldIssue {
  field: string;
  issue: string;
}

export type PorterValidationResult =
  | { ok: true; value: Required<LinkedPorterFactorInput> }
  | { ok: false; issues: PorterFieldIssue[] };

export const LINKED_PORTER_MESSAGES = {
  forceRequired: "القوة التنافسية مطلوبة.",
  forceInvalid: "القوة التنافسية المحددة غير صالحة.",
  trendRequired: "نص البند (التوجه أو المؤشر) مطلوب.",
  posRequired: "الانعكاس الإيجابي والفرصة المرتبطة مطلوب.",
  negRequired: "الانعكاس السلبي والمخاطر المرتبطة مطلوب.",
  tooLong: `يجب ألا يتجاوز طول النص ${MAX_FIELD_CHARS} حرفاً.`,
  parentMustBeTrend: "يجب أن يكون البند الأب من نوع توجه/مؤشر.",
  parentDifferentForce: "لا يمكن ربط انعكاس ببند في قوة تنافسية مختلفة.",
  duplicateImplication: "هذا البند التنافسي مرتبط مسبقاً بانعكاس من نفس النوع.",
} as const;

export function validateLinkedPorterInput(
  input: Partial<LinkedPorterFactorInput> | null | undefined
): PorterValidationResult {
  const issues: PorterFieldIssue[] = [];

  const force = input?.force;
  if (!force) {
    issues.push({ field: "force", issue: LINKED_PORTER_MESSAGES.forceRequired });
  } else if (!PORTER_FORCES.includes(force)) {
    issues.push({ field: "force", issue: LINKED_PORTER_MESSAGES.forceInvalid });
  }

  const content = typeof input?.content === "string" ? input.content.trim() : "";
  if (!content) {
    issues.push({ field: "content", issue: LINKED_PORTER_MESSAGES.trendRequired });
  } else if (content.length > MAX_FIELD_CHARS) {
    issues.push({ field: "content", issue: LINKED_PORTER_MESSAGES.tooLong });
  }

  const positive =
    typeof input?.positiveImplication === "string" ? input.positiveImplication.trim() : "";
  if (!positive) {
    issues.push({ field: "positiveImplication", issue: LINKED_PORTER_MESSAGES.posRequired });
  } else if (positive.length > MAX_FIELD_CHARS) {
    issues.push({ field: "positiveImplication", issue: LINKED_PORTER_MESSAGES.tooLong });
  }

  const negative =
    typeof input?.negativeImplication === "string" ? input.negativeImplication.trim() : "";
  if (!negative) {
    issues.push({ field: "negativeImplication", issue: LINKED_PORTER_MESSAGES.negRequired });
  } else if (negative.length > MAX_FIELD_CHARS) {
    issues.push({ field: "negativeImplication", issue: LINKED_PORTER_MESSAGES.tooLong });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      force: force!,
      content,
      positiveImplication: positive,
      negativeImplication: negative,
      positiveSource: input?.positiveSource ?? "manual",
      negativeSource: input?.negativeSource ?? "manual",
    },
  };
}

export interface PorterFactorRef {
  id: string;
  force: string;
  field: string;
  parentFactorId?: string | null;
  sortOrder?: number;
}

export function checkPorterImplicationLink(
  child: PorterFactorRef,
  parent: PorterFactorRef | null | undefined,
  existingSiblings: PorterFactorRef[] = []
): string | null {
  if (!parent) return "البند الأب غير موجود.";
  if (parent.field !== "trends") {
    return LINKED_PORTER_MESSAGES.parentMustBeTrend;
  }
  if (parent.force !== child.force) {
    return LINKED_PORTER_MESSAGES.parentDifferentForce;
  }
  const duplicate = existingSiblings.find(
    (s) => s.id !== child.id && s.parentFactorId === parent.id && s.field === child.field
  );
  if (duplicate) {
    return LINKED_PORTER_MESSAGES.duplicateImplication;
  }
  return null;
}

export function orderPorterImplications<T extends PorterFactorRef>(
  implications: T[],
  trends: PorterFactorRef[]
): T[] {
  const trendIndexMap = new Map<string, number>();
  trends.forEach((t, idx) => trendIndexMap.set(t.id, idx));

  return [...implications].sort((a, b) => {
    const parentA = a.parentFactorId ? trendIndexMap.get(a.parentFactorId) : undefined;
    const parentB = b.parentFactorId ? trendIndexMap.get(b.parentFactorId) : undefined;

    if (parentA !== undefined && parentB !== undefined) {
      if (parentA !== parentB) return parentA - parentB;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    if (parentA !== undefined) return -1;
    if (parentB !== undefined) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function findMissingPorterImplications(
  parentTrendId: string,
  siblings: PorterFactorRef[]
): { missingPositive: boolean; missingNegative: boolean } {
  const children = siblings.filter((s) => s.parentFactorId === parentTrendId);
  const hasPos = children.some((c) => c.field === "positiveImpacts");
  const hasNeg = children.some((c) => c.field === "negativeImpacts");
  return { missingPositive: !hasPos, missingNegative: !hasNeg };
}
