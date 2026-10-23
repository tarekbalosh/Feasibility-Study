/**
 * ─────────────────────────────────────────────────────────────
 *  ثوابت أداة تحليل قوى بورتر الخمس — مشتركة بين الخدمة والتوليد
 * ─────────────────────────────────────────────────────────────
 *  مفاتيح القوى تطابق أعمدة JSON في جدول porter_analyses
 *  (new_entrants / buyers / suppliers / substitutes / rivalry)،
 *  فلا تُغيَّر هنا دون تعديل schema.prisma.
 */

export const PORTER_TOOL_SLUG = "porter";

export const PORTER_FORCES = [
  "newEntrants",
  "buyers",
  "suppliers",
  "substitutes",
  "rivalry",
] as const;
export type PorterForceKey = (typeof PORTER_FORCES)[number];

/** الحقول النصية الثلاثة داخل كل قوة */
export const PORTER_FIELDS = ["trends", "positiveImpacts", "negativeImpacts"] as const;
export type PorterFieldKey = (typeof PORTER_FIELDS)[number];

export interface PorterForceContent {
  trends: string;
  positiveImpacts: string;
  negativeImpacts: string;
}

export type PorterForces = Record<PorterForceKey, PorterForceContent>;

export type PorterCreationModeKey = "manual" | "ai" | "hybrid";
export type PorterStatusKey = "draft" | "completed";

export const FORCE_LABELS: Record<PorterForceKey, string> = {
  newEntrants: "المنافسون الجدد",
  buyers: "العملاء والجمهور",
  suppliers: "مزودو الخدمة والموردون",
  substitutes: "المنتجات البديلة",
  rivalry: "المنافسة الحالية",
};

export const FIELD_LABELS: Record<PorterFieldKey, string> = {
  trends: "أبرز التوجهات والمؤشرات",
  positiveImpacts: "الانعكاسات الإيجابية المحتملة",
  negativeImpacts: "الانعكاسات السلبية المحتملة",
};

/** عدد النقاط المطلوب توليدها لكل حقل */
export const AI_POINTS_PER_FIELD = { trends: 4, positiveImpacts: 3, negativeImpacts: 3 } as const;

/** حدود الحماية */
export const MAX_FIELD_CHARS = 4000;
export const MIN_AI_DESCRIPTION_CHARS = 15;

export const emptyForce = (): PorterForceContent => ({
  trends: "",
  positiveImpacts: "",
  negativeImpacts: "",
});

export const emptyForces = (): PorterForces => ({
  newEntrants: emptyForce(),
  buyers: emptyForce(),
  suppliers: emptyForce(),
  substitutes: emptyForce(),
  rivalry: emptyForce(),
});
