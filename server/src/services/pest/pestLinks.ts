/**
 * ─────────────────────────────────────────────────────────────
 *  منطق ربط بنود التوجهات بانعكاساتها (دوال نقية قابلة للاختبار)
 * ─────────────────────────────────────────────────────────────
 *  كل بند في «أبرز التوجهات والمؤشرات» يملك انعكاساً إيجابياً واحداً
 *  وانعكاساً سلبياً واحداً في نفس البُعد، مرتبطين عبر parentFactorId.
 *  الانعكاسات القديمة (parentFactorId = null) تبقى مدعومة كما هي.
 */
import {
  PEST_DIMENSIONS,
  PestDimensionKey,
  PestCategoryKey,
  PestFactorSourceKey,
  MAX_FACTOR_CHARS,
} from "./pestConstants";

export type ImplicationCategory = "positive_impact" | "negative_impact";
export const IMPLICATION_CATEGORIES: readonly ImplicationCategory[] = [
  "positive_impact",
  "negative_impact",
] as const;

export function isImplicationCategory(c: unknown): c is ImplicationCategory {
  return c === "positive_impact" || c === "negative_impact";
}

export interface FieldIssue {
  field: string;
  issue: string;
}

export const LINKED_MESSAGES = {
  contentRequired: "نص البند (التوجه أو المؤشر) مطلوب.",
  positiveRequired: "الانعكاس الإيجابي والفرصة المرتبطة بهذا البند مطلوب.",
  negativeRequired: "الانعكاس السلبي والمخاطر المرتبطة بهذا البند مطلوب.",
  tooLong: `يجب ألا يتجاوز النص ${MAX_FACTOR_CHARS} حرفاً.`,
  dimensionInvalid: "البُعد غير صالح (يجب أن يكون أحد الأبعاد الخمسة).",
  implicationRequired: "نص الانعكاس مطلوب.",
} as const;

export interface LinkedFactorInput {
  dimension?: unknown;
  content?: unknown;
  positiveImplication?: unknown;
  negativeImplication?: unknown;
  /** النص الأصلي الذي اقترحه الذكاء الاصطناعي (لتحديد علامة AI بدقة) */
  aiSuggested?: { positive?: unknown; negative?: unknown } | null;
}

export interface ValidLinkedFactor {
  dimension: PestDimensionKey;
  content: string;
  positiveImplication: string;
  negativeImplication: string;
  positiveSource: PestFactorSourceKey;
  negativeSource: PestFactorSourceKey;
}

const asText = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function checkText(value: string, field: string, requiredMsg: string, issues: FieldIssue[]) {
  if (!value) issues.push({ field, issue: requiredMsg });
  else if (value.length > MAX_FACTOR_CHARS) issues.push({ field, issue: LINKED_MESSAGES.tooLong });
}

/**
 * علامة المصدر للانعكاس: «ai» إن حُفظ المقترح كما هو، «ai_edited» إن عُدّل، وإلا «manual».
 */
export function resolveSuggestedSource(finalText: string, suggestion: unknown): PestFactorSourceKey {
  const s = asText(suggestion);
  if (!s) return "manual";
  return s === finalText.trim() ? "ai" : "ai_edited";
}

/** التحقق من مدخلات إنشاء بند مع انعكاسيه — الحقول الثلاثة مطلوبة */
export function validateLinkedFactorInput(
  input: LinkedFactorInput
): { ok: true; value: ValidLinkedFactor } | { ok: false; issues: FieldIssue[] } {
  const issues: FieldIssue[] = [];
  const dimension = input?.dimension;
  if (!PEST_DIMENSIONS.includes(dimension as PestDimensionKey)) {
    issues.push({ field: "dimension", issue: LINKED_MESSAGES.dimensionInvalid });
  }

  const content = asText(input?.content);
  const positive = asText(input?.positiveImplication);
  const negative = asText(input?.negativeImplication);

  checkText(content, "content", LINKED_MESSAGES.contentRequired, issues);
  checkText(positive, "positiveImplication", LINKED_MESSAGES.positiveRequired, issues);
  checkText(negative, "negativeImplication", LINKED_MESSAGES.negativeRequired, issues);

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      dimension: dimension as PestDimensionKey,
      content,
      positiveImplication: positive,
      negativeImplication: negative,
      positiveSource: resolveSuggestedSource(positive, input?.aiSuggested?.positive),
      negativeSource: resolveSuggestedSource(negative, input?.aiSuggested?.negative),
    },
  };
}

export interface LinkableFactor {
  id: string;
  dimension: PestDimensionKey | string;
  category: PestCategoryKey | string;
  parentFactorId?: string | null;
}

/**
 * يتحقق من صحة ربط انعكاس ببند أب. يُرجع رسالة الخطأ أو null.
 *  - الانعكاس من فئة إيجابي/سلبي، والأب من فئة التوجهات، وفي نفس البُعد.
 *  - لا يوجد انعكاس آخر من نفس الفئة مرتبط بنفس الأب.
 */
export function checkImplicationLink(
  implication: Pick<LinkableFactor, "id" | "dimension" | "category">,
  parent: LinkableFactor | null | undefined,
  siblings: LinkableFactor[]
): string | null {
  if (!isImplicationCategory(implication.category)) {
    return "يمكن ربط الانعكاسات الإيجابية والسلبية فقط ببنود التوجهات.";
  }
  if (!parent) return "البند الأب غير موجود في هذا التحليل.";
  if (parent.category !== "trend") {
    return "البند الأب يجب أن يكون من «أبرز التوجهات والمؤشرات».";
  }
  if (parent.dimension !== implication.dimension) {
    return "لا يمكن ربط انعكاس ببند من بُعد آخر.";
  }
  const taken = siblings.some(
    (s) =>
      s.parentFactorId === parent.id &&
      s.category === implication.category &&
      s.id !== implication.id
  );
  if (taken) {
    return implication.category === "positive_impact"
      ? "هذا البند مرتبط مسبقاً بانعكاس إيجابي."
      : "هذا البند مرتبط مسبقاً بانعكاس سلبي.";
  }
  return null;
}

/**
 * ترتيب الانعكاسات في الصندوق: المرتبطة أولاً حسب ترتيب بنودها الأبوية،
 * ثم الانعكاسات القديمة غير المرتبطة بترتيبها الأصلي.
 */
export function orderImplications<T extends { id: string; parentFactorId?: string | null }>(
  trends: Array<{ id: string }>,
  implications: T[]
): T[] {
  const parentIndex = new Map(trends.map((t, i) => [t.id, i]));
  const linked: T[] = [];
  const unlinked: T[] = [];
  for (const f of implications) {
    if (f.parentFactorId && parentIndex.has(f.parentFactorId)) linked.push(f);
    else unlinked.push(f);
  }
  linked.sort(
    (a, b) => (parentIndex.get(a.parentFactorId!) ?? 0) - (parentIndex.get(b.parentFactorId!) ?? 0)
  );
  return [...linked, ...unlinked];
}

/** ما ينقص كل بند توجه من انعكاسات */
export function findMissingImplications(
  trends: Array<{ id: string }>,
  implications: Array<{ parentFactorId?: string | null; category: string }>
): Map<string, ImplicationCategory[]> {
  const has = new Set(implications.filter((f) => f.parentFactorId).map((f) => `${f.parentFactorId}:${f.category}`));
  const result = new Map<string, ImplicationCategory[]>();
  for (const t of trends) {
    const missing = IMPLICATION_CATEGORIES.filter((c) => !has.has(`${t.id}:${c}`));
    if (missing.length > 0) result.set(t.id, missing);
  }
  return result;
}
