import React from "react"
import clsx from "clsx"
import {
  Briefcase,
  Cpu,
  Factory,
  Lightbulb,
  PlusCircle,
  Rocket,
  ShoppingCart,
  Sparkles,
  Store,
  Utensils,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import type { SwotInput, SwotStage } from "@/types/swot"
import type { SwotFieldErrors } from "@/hooks/useSwotTool"

/** نفس قطاعات أداة دراسة الجدوى — لتبقى التسميات موحّدة عبر المنصة */
const SECTORS = [
  { id: "مطاعم وأغذية", icon: Utensils },
  { id: "تجارة وتجزئة", icon: ShoppingCart },
  { id: "خدمات", icon: Briefcase },
  { id: "تقني وناشئ", icon: Cpu },
  { id: "صناعي", icon: Factory },
  { id: "مجال آخر", icon: PlusCircle },
]

const STAGES: { id: SwotStage; label: string; hint: string; icon: typeof Rocket }[] = [
  {
    id: "idea",
    label: "فكرة",
    hint: "لم تبدأ التنفيذ بعد",
    icon: Lightbulb,
  },
  {
    id: "running",
    label: "مشروع قائم",
    hint: "يعمل ولديه عملاء",
    icon: Store,
  },
  {
    id: "expansion",
    label: "مرحلة توسّع",
    hint: "فرع أو خط إيراد جديد",
    icon: Rocket,
  },
]

const DESCRIPTION_MIN = 30
const DESCRIPTION_MAX = 1000

interface SwotFormProps {
  input: SwotInput
  errors: SwotFieldErrors
  setField: <K extends keyof SwotInput>(key: K, value: SwotInput[K]) => void
  onSubmit: () => void
  /** يوجد تحليل سابق — نعرض زر العودة إليه بدل بدء تحليل جديد */
  hasAnalysis?: boolean
  onBackToResult?: () => void
}

export const SwotForm: React.FC<SwotFormProps> = ({
  input,
  errors,
  setField,
  onSubmit,
  hasAnalysis = false,
  onBackToResult,
}) => {
  const descriptionLength = input.description.trim().length

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-8"
      dir="rtl"
    >
      {/* القطاع */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">
            ما مجال مشروعك؟ <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            القطاع يحدّد العوامل الداخلية والخارجية التي تُقاس عليها مصفوفتك.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTORS.map((sector) => {
            const Icon = sector.icon
            const isSelected = input.sector === sector.id
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setField("sector", sector.id)}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  isSelected
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-slate-100 bg-white hover:border-sky-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <Icon
                  className={clsx(
                    "w-6 h-6",
                    isSelected ? "text-sky-600" : "text-slate-400"
                  )}
                />
                <span className="text-sm font-medium text-center">{sector.id}</span>
              </button>
            )
          })}
        </div>
        {errors.sector && (
          <span className="text-xs text-red-500 font-medium">{errors.sector}</span>
        )}
      </div>

      {/* مرحلة المشروع */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-slate-700">
          في أي مرحلة مشروعك الآن؟
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STAGES.map((stage) => {
            const Icon = stage.icon
            const isSelected = input.stage === stage.id
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setField("stage", stage.id)}
                className={clsx(
                  "flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all duration-200",
                  isSelected
                    ? "border-sky-600 bg-sky-50"
                    : "border-slate-100 bg-white hover:border-sky-200 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5 shrink-0",
                    isSelected ? "text-sky-600" : "text-slate-400"
                  )}
                />
                <span className="flex flex-col">
                  <span
                    className={clsx(
                      "text-sm font-bold",
                      isSelected ? "text-sky-700" : "text-slate-800"
                    )}
                  >
                    {stage.label}
                  </span>
                  <span className="text-xs text-slate-500">{stage.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* اسم المشروع */}
      <Input
        label="اسم المشروع أو الفكرة *"
        value={input.projectName}
        onChange={(e) => setField("projectName", e.target.value)}
        error={errors.projectName}
        placeholder="مثال: مقهى تخصصي في حي الياسمين"
        maxLength={100}
      />

      {/* الوصف */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-semibold text-slate-700">
            وصف المشروع ونشاطه <span className="text-red-500">*</span>
          </label>
          <span
            className={clsx(
              "text-xs font-medium tabular-nums",
              descriptionLength < DESCRIPTION_MIN ? "text-slate-400" : "text-emerald-600"
            )}
          >
            {descriptionLength} / {DESCRIPTION_MIN} حرفاً كحد أدنى
          </span>
        </div>
        <textarea
          value={input.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={5}
          maxLength={DESCRIPTION_MAX}
          placeholder="ماذا يقدّم مشروعك بالضبط؟ ما الذي يميّزه؟ ما موارده الحالية (فريق، موقع، رأس مال، خبرة)؟ كلما زاد التفصيل، صار التحليل أدق."
          className={clsx(
            "w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 leading-relaxed focus:outline-none focus:ring-1 transition-all duration-150",
            errors.description
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-slate-200 focus:border-sky-500 focus:ring-sky-500"
          )}
        />
        {errors.description && (
          <span className="text-xs text-red-500 font-medium">
            {errors.description}
          </span>
        )}
      </div>

      {/* حقول اختيارية تُحسّن دقة التحليل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="الفئة أو السوق المستهدف (اختياري)"
          value={input.targetMarket ?? ""}
          onChange={(e) => setField("targetMarket", e.target.value)}
          placeholder="مثال: موظفو المكاتب من 25 إلى 40 سنة"
          maxLength={200}
        />
        <Input
          label="المنافسون الرئيسيون (اختياري)"
          value={input.competitors ?? ""}
          onChange={(e) => setField("competitors", e.target.value)}
          placeholder="مثال: مقهيان في نفس الحي وسلسلة كبرى"
          maxLength={300}
        />
      </div>

      {/* أزرار الإجراء */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto px-8 py-3 text-base font-bold gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
        >
          <Sparkles className="w-5 h-5" />
          التالي — اختر عناصر مشروعك
        </Button>

        {hasAnalysis && onBackToResult && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBackToResult}
            className="w-full sm:w-auto border border-slate-200 bg-white hover:bg-slate-50"
          >
            عودة إلى التحليل الحالي
          </Button>
        )}

        <p className="text-xs text-slate-400 sm:mr-auto text-center sm:text-right">
          بلا تسجيل، وبلا بطاقة دفع.
        </p>
      </div>
    </form>
  )
}

export default SwotForm
