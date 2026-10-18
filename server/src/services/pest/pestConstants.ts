/**
 * ─────────────────────────────────────────────────────────────
 *  ثوابت أداة تحليل PEST — مشتركة بين الخدمة والتوليد والاختبارات
 * ─────────────────────────────────────────────────────────────
 *  القيم تطابق enums قاعدة البيانات حرفياً (pest_dimension …)،
 *  فلا تُغيَّر هنا دون تعديل schema.prisma.
 */

export const PEST_TOOL_SLUG = "pest";

export const PEST_DIMENSIONS = [
  "political",
  "economic",
  "social",
  "technological",
  "legal",
] as const;
export type PestDimensionKey = (typeof PEST_DIMENSIONS)[number];

export const PEST_CATEGORIES = ["trend", "positive_impact", "negative_impact"] as const;
export type PestCategoryKey = (typeof PEST_CATEGORIES)[number];

export const PEST_SOURCES = ["manual", "ai", "ai_edited"] as const;
export type PestSourceKey = (typeof PEST_SOURCES)[number];
export type PestFactorSourceKey = PestSourceKey;

export type PestCreationModeKey = "manual" | "ai" | "hybrid";
export type PestScopeKey = "full" | "dimension" | "category";
export type PestStrategyKey = "replace" | "append";

export const DIMENSION_LABELS: Record<PestDimensionKey, string> = {
  political: "البعد السياسي",
  economic: "البعد الاقتصادي",
  social: "البعد الاجتماعي",
  technological: "البعد التقني",
  legal: "البعد القانوني",
};

export const CATEGORY_LABELS: Record<PestCategoryKey, string> = {
  trend: "أبرز التوجهات والمؤشرات",
  positive_impact: "الانعكاسات الإيجابية المحتملة",
  negative_impact: "الانعكاسات السلبية المحتملة",
};

/** الأعداد الافتراضية لكل بُعد عند التوليد الكامل أو الاستبدال */
export const DEFAULT_COUNTS: Record<PestCategoryKey, number> = {
  trend: 5,
  positive_impact: 4,
  negative_impact: 4,
};

/** عدد الاقتراحات لكل عمود في وضع append */
export const APPEND_COUNT_PER_CELL = 3;

/** حدود الحماية */
export const MAX_FACTOR_CHARS = 600;
export const MAX_FACTORS_PER_ANALYSIS = 400;
