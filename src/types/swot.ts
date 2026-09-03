/**
 * أنواع أداة تحليل SWOT
 * تُستخدم على الطرفين: نموذج الإدخال في المتصفح، ومسار الـ API على الخادم.
 */

import type { SwotCategory } from "@/config/swotSuggestions"

/** مرحلة المشروع — تغيّر زاوية التحليل بالكامل */
export type SwotStage = "idea" | "running" | "expansion"

/** مدخلات المستخدم التي يُبنى عليها التحليل */
export interface SwotInput {
  /** اسم المشروع أو الفكرة */
  projectName: string
  /** القطاع — نفس قائمة قطاعات أداة دراسة الجدوى */
  sector: string
  /** وصف المشروع ونشاطه */
  description: string
  /** الفئة أو السوق المستهدف */
  targetMarket?: string
  /** المنافسون الرئيسيون */
  competitors?: string
  stage: SwotStage
}

/** مفاتيح أرباع المصفوفة الأربعة */
export type SwotQuadrantKey = SwotCategory

// ─────────────────────────────────────────────────────────────
//  اختيارات المستخدم في شاشة اختيار العناصر (الخطوة الوسيطة)
// ─────────────────────────────────────────────────────────────

/** بند أضافه المستخدم بنفسه — لا يوجد في القوائم الجاهزة */
export interface SwotCustomItem {
  /** معرّف محلي يبدأ بـ custom- */
  id: string
  label: string
}

/** حالة مجموعة واحدة من المجموعات الأربع */
export interface SwotCategorySelection {
  /** معرّفات البنود المحدَّدة — جاهزة ومخصّصة معاً */
  selectedIds: string[]
  /** البنود التي أضافها المستخدم في هذه المجموعة */
  customItems: SwotCustomItem[]
}

/** اختيارات المستخدم الكاملة قبل التوليد */
export type SwotSelections = Record<SwotQuadrantKey, SwotCategorySelection>

/** اختيارات فارغة — نقطة البداية وقيمة الإرجاع عند التخطّي */
export const emptySwotSelections = (): SwotSelections => ({
  strengths: { selectedIds: [], customItems: [] },
  weaknesses: { selectedIds: [], customItems: [] },
  opportunities: { selectedIds: [], customItems: [] },
  threats: { selectedIds: [], customItems: [] },
})

/**
 * الاختيارات بصيغة نصوص جاهزة للإرسال إلى الخادم.
 * الخادم لا يحتاج المعرّفات، بل النصوص وأزواج التعارض فقط.
 */
export interface SwotSelectionPayload {
  /** نصوص البنود المختارة في كل مجموعة */
  items: Record<SwotQuadrantKey, string[]>
  /** أزواج قوة/ضعف اختار المستخدم طرفيها معاً */
  conflicts: { strength: string; weakness: string }[]
}

// ─────────────────────────────────────────────────────────────
//  مخرجات التحليل
// ─────────────────────────────────────────────────────────────

/** درجة أهمية البند */
export type SwotImportance = "high" | "medium" | "low"

/** بند واحد في المصفوفة */
export interface SwotItem {
  /** عنوان مختصر للبند */
  title: string
  /** شرح مرتبط بقطاع المشروع ونشاطه — لا تعريف عام للمصطلح */
  detail?: string
  /** user → من اختيار المستخدم | ai → أضافه النموذج */
  source: "user" | "ai"
  importance?: SwotImportance
}

/** بنود المصفوفة — قائمة بنود لكل ربع */
export type SwotQuadrants = Record<SwotQuadrantKey, SwotItem[]>

/**
 * الاستراتيجيات المستخرجة من تقاطعات المصفوفة
 * so → قوة × فرصة | wo → ضعف × فرصة
 * st → قوة × تهديد | wt → ضعف × تهديد
 */
export interface SwotStrategies {
  so: string[]
  wo: string[]
  st: string[]
  wt: string[]
}

/** مفاتيح تقاطعات المصفوفة */
export type SwotStrategyKey = keyof SwotStrategies

/**
 * معرّف استراتيجية بعينها داخل التحليل: مفتاح التقاطع ثم ترتيبها فيه
 * ابتداءً من ١ — مثل so-1. به تُربط كل أولوية بأصلها في المصفوفة.
 */
export type SwotStrategyId = string

/** الإطار الزمني لبند الأولويات */
export type SwotHorizon = "30d" | "60d" | "90d"

/**
 * بند من أولويات الـ ٩٠ يوماً — يُشتقّ من استراتيجية قائمة في التحليل
 * ولا يُدخل فكرة جديدة لم تظهر فيه.
 */
export interface SwotPriority {
  /** فعل تنفيذي مباشر يبدأ بفعل أمر */
  action: string
  /** سطر واحد يربط الإجراء ببند محدد في المصفوفة */
  rationale: string
  /** رقم أو حدث يُعرف به الإنجاز */
  successMetric: string
  horizon: SwotHorizon
  /** الاستراتيجية التي اشتُقّ منها البند — مثل so-1 */
  sourceStrategyId: SwotStrategyId
}

/** الحد الأقصى لعدد الأولويات — خلاصة لا قائمة مهام */
export const MAX_PRIORITIES = 3

/** ناتج التحليل الكامل */
export interface SwotAnalysis extends SwotQuadrants {
  /** معرّف التقرير القصير — مثل SWT-7F3K2 */
  id: string
  /** تاريخ التوليد بصيغة ISO */
  generatedAt: string
  /** تاريخ آخر تعديل يدوي على التقرير — يغيب ما لم يُعدَّل */
  updatedAt?: string
  /** ملخص تنفيذي من عبارة إلى ثلاث */
  summary: string
  strategies: SwotStrategies
  /**
   * أولويات الـ ٩٠ يوماً — ثلاثة بنود على الأكثر. قد تعود أقل أو فارغة
   * إن لم تُنتج الاستراتيجيات ما يكفي: لا تُحشى ببنود عامة.
   */
  priorities: SwotPriority[]
  /**
   * مصدر التحليل:
   * ai        → مولَّد بالذكاء الاصطناعي
   * heuristic → مولَّد بقواعد المنصة (عند عدم توفّر مفتاح OpenAI أو تعذّر الاتصال)
   */
  source: "ai" | "heuristic"
}

/** استجابة POST /api/tools/swot */
export interface SwotApiResponse {
  analysis: SwotAnalysis
}
