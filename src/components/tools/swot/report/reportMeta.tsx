import React from "react"
import clsx from "clsx"
import {
  AlertTriangle,
  Info,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  formatReportDate,
  formatReportDateTime,
  strategyById,
} from "@/utils/swotReport"
import type {
  SwotAnalysis,
  SwotHorizon,
  SwotInput,
  SwotItem,
  SwotQuadrantKey,
  SwotStrategyKey,
} from "@/types/swot"

/**
 * ─────────────────────────────────────────────────────────────
 *  ثوابت تقرير SWOT وكتله المشتركة
 * ─────────────────────────────────────────────────────────────
 *  يقرأ منها مكوّنا التقرير: SwotReportView (الشاشة) و
 *  SwotReportDocument (التصدير). كل ما هنا خالٍ من التفاعل، فلا
 *  يتسرّب زر إلى ملف الـ PDF من هذا الطريق.
 * ─────────────────────────────────────────────────────────────
 */

/** اسم المنصة كما يظهر في التقرير المصدَّر */
export const PLATFORM_NAME = "Feasibility Suite"

/** عرض كل ربع: العنوان، وصفه، وألوانه */
export const QUADRANTS: {
  key: SwotQuadrantKey
  letter: string
  title: string
  subtitle: string
  icon: typeof TrendingUp
  ring: string
  header: string
  chip: string
  dot: string
}[] = [
  {
    key: "strengths",
    letter: "S",
    title: "نقاط القوة",
    subtitle: "عوامل داخلية تعمل لصالحك",
    icon: TrendingUp,
    ring: "border-emerald-200",
    header: "bg-emerald-50 text-emerald-800",
    chip: "bg-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    key: "weaknesses",
    letter: "W",
    title: "نقاط الضعف",
    subtitle: "عوامل داخلية تحتاج معالجة",
    icon: TrendingDown,
    ring: "border-rose-200",
    header: "bg-rose-50 text-rose-800",
    chip: "bg-rose-600",
    dot: "bg-rose-500",
  },
  {
    key: "opportunities",
    letter: "O",
    title: "الفرص",
    subtitle: "عوامل خارجية يمكن اقتناصها",
    icon: Target,
    ring: "border-sky-200",
    header: "bg-sky-50 text-sky-800",
    chip: "bg-sky-600",
    dot: "bg-sky-500",
  },
  {
    key: "threats",
    letter: "T",
    title: "المخاطر",
    subtitle: "عوامل خارجية يجب التحوّط لها",
    icon: AlertTriangle,
    ring: "border-amber-200",
    header: "bg-amber-50 text-amber-800",
    chip: "bg-amber-600",
    dot: "bg-amber-500",
  },
]

/** تقاطعات المصفوفة */
export const STRATEGY_GROUPS: {
  key: SwotStrategyKey
  title: string
  formula: string
  accent: string
}[] = [
  {
    key: "so",
    title: "استراتيجيات هجومية",
    formula: "قوة × فرصة",
    accent: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    key: "wo",
    title: "استراتيجيات تطويرية",
    formula: "ضعف × فرصة",
    accent: "text-sky-700 bg-sky-50 border-sky-100",
  },
  {
    key: "st",
    title: "استراتيجيات دفاعية",
    formula: "قوة × تهديد",
    accent: "text-amber-700 bg-amber-50 border-amber-100",
  },
  {
    key: "wt",
    title: "استراتيجيات انكفائية",
    formula: "ضعف × تهديد",
    accent: "text-rose-700 bg-rose-50 border-rose-100",
  },
]

/** نصّ الأفق الزمني كما يُقرأ في التقرير */
export const HORIZON_LABELS: Record<SwotHorizon, string> = {
  "30d": "أول ٣٠ يوماً",
  "60d": "أول ٦٠ يوماً",
  "90d": "أول ٩٠ يوماً",
}

/** لون شارة الأفق — الأقرب أجلاً أكثر إلحاحاً */
export const HORIZON_STYLES: Record<SwotHorizon, string> = {
  "30d": "bg-rose-100 text-rose-800 border-rose-200",
  "60d": "bg-amber-100 text-amber-800 border-amber-200",
  "90d": "bg-sky-100 text-sky-800 border-sky-200",
}

/** الاستراتيجية التي اشتُقّت منها الأولوية، كما تُعرض تحت البند */
export const prioritySourceLabel = (
  analysis: SwotAnalysis,
  sourceStrategyId: string
): string | undefined => {
  const group = STRATEGY_GROUPS.find((g) =>
    sourceStrategyId.startsWith(`${g.key}-`)
  )
  const text = strategyById(analysis.strategies, sourceStrategyId)
  if (!group || !text) return undefined
  return `${group.title} — ${text}`
}

/** نص إخلاء المسؤولية: مصدره واحد فلا يتفرّق بين الشاشة والتصدير */
export const DISCLAIMER_TEXT =
  "هذا التحليل أداة تفكير استراتيجي، وليس بديلاً عن دراسة جدوى مالية ولا عن استشارة متخصصة. الأرقام — قائمة الدخل والتدفقات النقدية ونقطة التعادل — تُبنى في أداة دراسة الجدوى. راجع بنوده وقارنها بواقع مشروعك وسوقك قبل بناء أي قرار عليها."

/** وصف مصدر التوليد بلغة يفهمها المستخدم النهائي */
export const sourceLabel = (analysis: SwotAnalysis): string =>
  analysis.source === "ai"
    ? "مُعدّ بالذكاء الاصطناعي بناءً على بيانات مشروعك"
    : "مُعدّ بقواعد تحليل جاهزة حسب قطاع مشروعك ومرحلته"

// ─────────────────────────────────────────────────────────────
//  كتل مشتركة بين الشاشة والتصدير — بلا أي عنصر تفاعلي
// ─────────────────────────────────────────────────────────────

/** صفّ واحد في صندوق بيانات التقرير */
const MetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-baseline gap-1.5 min-w-0">
    <span className="text-slate-400 shrink-0">{label}:</span>
    <span className="text-slate-600 font-medium truncate">{children}</span>
  </div>
)

/**
 * بيانات التقرير — تظهر في الشاشة والتصدير معاً.
 * الشاشة تمرّر زر نسخ المعرّف عبر idAction؛ التصدير لا يمرّر شيئاً
 * فيبقى المستند خالياً من العناصر التفاعلية.
 */
export const ReportMetaBox: React.FC<{
  input: SwotInput
  analysis: SwotAnalysis
  idAction?: React.ReactNode
}> = ({ input, analysis, idAction }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-[11px] leading-relaxed">
      <MetaRow label="المشروع">{input.projectName || "—"}</MetaRow>
      <MetaRow label="القطاع">{input.sector || "—"}</MetaRow>
      <MetaRow label="تاريخ التوليد">
        {formatReportDate(analysis.generatedAt)}
      </MetaRow>
      <MetaRow label="آخر تعديل">
        {analysis.updatedAt ? formatReportDateTime(analysis.updatedAt) : "لا تعديل"}
      </MetaRow>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-slate-400 shrink-0">معرّف التقرير:</span>
        <span className="text-slate-700 font-bold tracking-wider font-mono">
          {analysis.id}
        </span>
        {idAction}
      </div>
      <MetaRow label="المنصة">{PLATFORM_NAME}</MetaRow>
    </div>
  </div>
)

/** إخلاء المسؤولية — بلوك مستقل بحدّ علوي، منفصل عن محتوى التحليل */
export const ReportDisclaimer: React.FC<{ analysis: SwotAnalysis }> = ({
  analysis,
}) => (
  <div className="rounded-xl border border-slate-200 border-t-4 border-t-slate-300 bg-slate-50 px-4 py-3.5">
    <div className="flex items-start gap-2.5">
      <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-slate-700">
          حدود هذا التقرير
        </span>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>
        <p className="text-[11px] text-slate-400">{sourceLabel(analysis)}.</p>
      </div>
    </div>
  </div>
)

/** السطر البديل حين لا تكفي الاستراتيجيات لبناء أولويات */
export const PrioritiesShortfallNote: React.FC<{ count: number }> = ({
  count,
}) => (
  <p className="text-[11px] text-slate-500 leading-relaxed">
    {count === 0
      ? "لم تُنتج استراتيجيات هذا التحليل ما يكفي لاشتقاق أولويات تنفيذية. لم نملأ الفراغ ببنود عامة — أضف بنوداً أدقّ في «تعديل الاختيارات» ثم أعد التوليد."
      : `اشتُقّت ${count.toLocaleString("ar-EG")} من ٣ أولويات فقط: لم تُنتج بقية الاستراتيجيات إجراءً قابلاً للقياس. لم نملأ الفراغ ببنود عامة.`}
  </p>
)

/** سطر البند في نسخة النسخ إلى الحافظة والتصدير النصي */
const itemLine = (item: SwotItem): string =>
  item.detail ? `${item.title} — ${item.detail}` : item.title

/** يبني نسخة نصية من التقرير — للنسخ إلى الحافظة */
export const toPlainText = (
  input: SwotInput,
  analysis: SwotAnalysis
): string => {
  const section = (title: string, items: string[]) =>
    `${title}\n${items.map((item) => `- ${item}`).join("\n")}`

  const priorities = (analysis.priorities ?? []).map(
    (priority, index) =>
      `${index + 1}. ${priority.action} (${HORIZON_LABELS[priority.horizon]})\n   السبب: ${priority.rationale}\n   مؤشر النجاح: ${priority.successMetric}`
  )

  return [
    `تحليل SWOT — ${input.projectName}`,
    `القطاع: ${input.sector}`,
    `معرّف التقرير: ${analysis.id} · تاريخ التوليد: ${formatReportDate(analysis.generatedAt)}`,
    "",
    `الملخص التنفيذي:\n${analysis.summary}`,
    "",
    ...QUADRANTS.map((q) => section(q.title, (analysis[q.key] ?? []).map(itemLine))),
    "",
    ...STRATEGY_GROUPS.map((g) =>
      section(`${g.title} (${g.formula})`, analysis.strategies?.[g.key] ?? [])
    ),
    "",
    priorities.length
      ? `ابدأ من هنا — أولويات الـ ٩٠ يوماً:\n${priorities.join("\n")}`
      : "ابدأ من هنا — أولويات الـ ٩٠ يوماً: لا أولويات مشتقّة من هذا التحليل.",
    "",
    DISCLAIMER_TEXT,
    `${PLATFORM_NAME} · ${analysis.id}`,
  ].join("\n\n")
}

/** يجمع أصناف الشارة الملوّنة للأفق الزمني */
export const horizonBadgeClass = (horizon: SwotHorizon): string =>
  clsx(
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0",
    HORIZON_STYLES[horizon]
  )
