import {
  BarChart3,
  Calculator,
  ClipboardList,
  Grid2x2,
  Landmark,
  PieChart,
  Tags,
} from "lucide-react"
import type {
  ToolCategory,
  ToolCategoryMeta,
  ToolDefinition,
} from "@/types/tool"

/**
 * ─────────────────────────────────────────────────────────────
 *  سجلّ الأدوات — المصدر الوحيد للحقيقة
 * ─────────────────────────────────────────────────────────────
 *  لإضافة أداة جديدة إلى المنصة:
 *    1. أضف تعريفها هنا.
 *    2. اربط مكوّنها في src/config/tools.components.tsx
 *  ولا حاجة لأي تعديل آخر — الكتالوج والتوجيه ولوحة التحكم
 *  كلها تقرأ من هذا الملف تلقائياً.
 * ─────────────────────────────────────────────────────────────
 */
export const TOOLS: ToolDefinition[] = [
  {
    slug: "feasibility-study",
    name: "دراسة الجدوى الذكية",
    shortDescription:
      "أنشئ دراسة جدوى احترافية متكاملة لمشروعك بالذكاء الاصطناعي خلال دقائق.",
    longDescription:
      "أداة متعددة الخطوات تجمع بيانات مشروعك المالية والتشغيلية، ثم تحلّلها وتصدر لك دراسة جدوى كاملة تشمل التحليل السوقي، قائمة الدخل التقديرية، التدفقات النقدية، نقطة التعادل، ومؤشرات العائد على الاستثمار — جاهزة للتقديم للبنوك وجهات التمويل.",
    icon: ClipboardList,
    category: "planning",
    status: "live",
    accent: {
      gradient: "from-indigo-500 to-violet-600",
      text: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      dot: "bg-indigo-500",
    },
    requiresAuth: false,
    order: 1,
    highlights: [
      "تحليل السوق و SWOT بالذكاء الاصطناعي",
      "قائمة دخل وتدفقات نقدية تقديرية",
      "تصدير التقرير بصيغة PDF",
    ],
    estimatedMinutes: 12,
    featured: true,
    legacyPath: "/tool/FeasibilityTool",
  },
  {
    slug: "swot",
    name: "تحليل SWOT",
    shortDescription:
      "اكتشف نقاط قوة مشروعك وضعفه والفرص والتهديدات المحيطة به في تحليل رباعي واحد.",
    longDescription:
      "أداة تحليل استراتيجي — تُعرف أيضاً بالتحليل الرباعي أو مصفوفة سوات — تأخذ وصف مشروعك وقطاعه وسوقه المستهدف، ثم تبني لك مصفوفة SWOT رباعية متكاملة — نقاط القوة، نقاط الضعف، الفرص، والتهديدات — مرفقة بتوصيات استراتيجية عملية مبنية على تقاطعات المصفوفة، وجاهزة للطباعة أو التصدير.",
    icon: Grid2x2,
    category: "analysis",
    status: "live",
    accent: {
      gradient: "from-sky-500 to-cyan-600",
      text: "text-sky-600",
      bg: "bg-sky-50",
      border: "border-sky-100",
      dot: "bg-sky-500",
    },
    requiresAuth: false,
    order: 2,
    highlights: [
      "مصفوفة رباعية كاملة بالذكاء الاصطناعي",
      "توصيات استراتيجية من تقاطعات المصفوفة",
      "تحرير البنود وطباعة التحليل",
    ],
    estimatedMinutes: 4,
    featured: true,
  },
  {
    slug: "break-even-calculator",
    name: "حاسبة نقطة التعادل",
    shortDescription:
      "احسب حجم المبيعات المطلوب لتغطية تكاليفك الثابتة والمتغيرة.",
    longDescription:
      "أدخل تكاليفك الثابتة والمتغيرة وسعر البيع، لتعرف فوراً عدد الوحدات وقيمة الإيرادات التي يبدأ عندها مشروعك بتحقيق الربح، مع رسم بياني توضيحي لنقطة التعادل.",
    icon: BarChart3,
    category: "financial",
    status: "soon",
    accent: {
      gradient: "from-emerald-500 to-teal-600",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      dot: "bg-emerald-500",
    },
    requiresAuth: false,
    order: 3,
    highlights: [
      "نقطة التعادل بالوحدات وبالقيمة",
      "رسم بياني تفاعلي",
      "هامش الأمان التشغيلي",
    ],
    estimatedMinutes: 3,
    featured: true,
  },
  {
    slug: "pricing-calculator",
    name: "حاسبة التسعير",
    shortDescription:
      "حدّد السعر الأمثل لمنتجك أو خدمتك بناءً على التكلفة وهامش الربح المستهدف.",
    longDescription:
      "احسب سعر البيع المناسب انطلاقاً من تكلفة الوحدة وهامش الربح المستهدف، مع أخذ العمولات والضريبة والخصومات في الحسبان، ومقارنة سيناريوهات تسعير متعددة جنباً إلى جنب.",
    icon: Tags,
    category: "financial",
    status: "soon",
    accent: {
      gradient: "from-amber-500 to-orange-600",
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      dot: "bg-amber-500",
    },
    requiresAuth: false,
    order: 4,
    highlights: [
      "التسعير بالتكلفة أو بالهامش",
      "احتساب العمولة والضريبة",
      "مقارنة سيناريوهات",
    ],
    estimatedMinutes: 2,
  },
  {
    slug: "loan-calculator",
    name: "حاسبة التمويل والأقساط",
    shortDescription:
      "اعرف قيمة القسط الشهري وإجمالي التكلفة قبل التوقيع على أي تمويل.",
    longDescription:
      "أدخل مبلغ التمويل ونسبة الفائدة ومدة السداد، لتحصل على جدول إطفاء كامل يوضّح القسط الشهري وتوزيعه بين أصل الدين والفوائد وإجمالي المبلغ المسدد على مدى فترة القرض.",
    icon: Landmark,
    category: "financial",
    status: "soon",
    accent: {
      gradient: "from-blue-500 to-indigo-600",
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      dot: "bg-blue-500",
    },
    requiresAuth: false,
    order: 5,
    highlights: [
      "جدول إطفاء تفصيلي",
      "إجمالي الفوائد والتكلفة",
      "مقارنة مدد السداد",
    ],
    estimatedMinutes: 2,
  },
  {
    slug: "roi-calculator",
    name: "حاسبة العائد على الاستثمار",
    shortDescription:
      "قِس جدوى استثمارك عبر ROI و IRR وفترة استرداد رأس المال.",
    longDescription:
      "أدخل رأس المال المستثمر والتدفقات النقدية المتوقعة، لتحصل على معدل العائد على الاستثمار، معدل العائد الداخلي، صافي القيمة الحالية، وفترة الاسترداد — مؤشرات تحسم قرارك الاستثماري بالأرقام.",
    icon: PieChart,
    category: "analysis",
    status: "soon",
    accent: {
      gradient: "from-violet-500 to-purple-600",
      text: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
      dot: "bg-violet-500",
    },
    requiresAuth: false,
    order: 6,
    highlights: [
      "ROI و IRR و NPV",
      "فترة استرداد رأس المال",
      "تحليل حساسية مبسّط",
    ],
    estimatedMinutes: 4,
  },
  {
    slug: "business-plan",
    name: "مولّد خطة العمل",
    shortDescription:
      "حوّل فكرتك إلى خطة عمل مكتوبة ومنظّمة جاهزة للعرض على المستثمرين.",
    longDescription:
      "أجب عن أسئلة موجّهة حول فكرتك وسوقك المستهدف ونموذج إيراداتك، وسيتولى الذكاء الاصطناعي صياغة خطة عمل متكاملة تشمل الملخص التنفيذي ونموذج العمل واستراتيجية التسويق وخارطة الطريق التنفيذية.",
    icon: Calculator,
    category: "planning",
    status: "soon",
    accent: {
      gradient: "from-rose-500 to-pink-600",
      text: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      dot: "bg-rose-500",
    },
    requiresAuth: true,
    order: 7,
    highlights: [
      "ملخص تنفيذي احترافي",
      "نموذج العمل التجاري",
      "خارطة طريق تنفيذية",
    ],
    estimatedMinutes: 8,
  },
]

/** تسميات التصنيفات لفلترة الكتالوج */
export const TOOL_CATEGORIES: ToolCategoryMeta[] = [
  { key: "all", label: "جميع الأدوات" },
  { key: "planning", label: "التخطيط والدراسات" },
  { key: "financial", label: "الحاسبات المالية" },
  { key: "analysis", label: "التحليل والمؤشرات" },
]

/** تسميات حالات الأدوات */
export const TOOL_STATUS_LABELS: Record<ToolDefinition["status"], string> = {
  live: "متاحة الآن",
  beta: "تجريبية",
  soon: "قريباً",
}

// ─────────────────────────────────────────────────────────────
//  دوال مساعدة
// ─────────────────────────────────────────────────────────────

/** جميع الأدوات مرتبةً حسب حقل order */
export const getAllTools = (): ToolDefinition[] =>
  [...TOOLS].sort((a, b) => a.order - b.order)

/** الأدوات الجاهزة للاستخدام فقط */
export const getAvailableTools = (): ToolDefinition[] =>
  getAllTools().filter((tool) => tool.status !== "soon")

/** البحث عن أداة عبر المعرّف */
export const getToolBySlug = (slug?: string | string[]): ToolDefinition | undefined => {
  if (typeof slug !== "string") return undefined
  return TOOLS.find((tool) => tool.slug === slug)
}

/** فلترة الأدوات حسب التصنيف */
export const getToolsByCategory = (
  category: ToolCategory | "all"
): ToolDefinition[] =>
  category === "all"
    ? getAllTools()
    : getAllTools().filter((tool) => tool.category === category)

/** أدوات الصفحة الرئيسية — المعلَّمة بـ featured فقط */
export const getFeaturedTools = (): ToolDefinition[] =>
  getAllTools().filter((tool) => tool.featured)

/** الرابط الكامل لصفحة تعريف الأداة (Landing) */
export const getToolPath = (slug: string): string => `/tools/${slug}`

/** الرابط الكامل لتشغيل الأداة نفسها */
export const getToolStartPath = (slug: string): string => `/tools/${slug}/start`

/** المعرّف الافتراضي — يُستخدم لربط المشاريع القديمة بأداة دراسة الجدوى */
export const DEFAULT_TOOL_SLUG = "feasibility-study"
