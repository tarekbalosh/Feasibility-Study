import React, { useState, useEffect } from "react"
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Compass,
  Check,
  X,
  Loader2,
} from "lucide-react"
import type { PestDimension } from "@/types/pest"
import { PEST_THEMES } from "@/config/pestTheme"

interface AddTrendModalProps {
  isOpen: boolean
  dimension: PestDimension
  initialContent?: string
  initialPositive?: string
  initialNegative?: string
  onClose: () => void
  onSubmit: (data: {
    content: string
    positiveImplication: string
    negativeImplication: string
    aiSuggested?: { positive?: string; negative?: string } | null
  }) => Promise<void>
  onSuggest: (content: string) => Promise<{ positiveImplication: string; negativeImplication: string }>
}

export const AddTrendModal: React.FC<AddTrendModalProps> = ({
  isOpen,
  dimension,
  initialContent = "",
  initialPositive = "",
  initialNegative = "",
  onClose,
  onSubmit,
  onSuggest,
}) => {
  const [content, setContent] = useState(initialContent)
  const [positive, setPositive] = useState(initialPositive)
  const [negative, setNegative] = useState(initialNegative)

  const [aiSuggested, setAiSuggested] = useState<{ positive?: string; negative?: string } | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // رسائل التحقق بالعربية تحت كل حقل
  const [errors, setErrors] = useState<{
    content?: string
    positive?: string
    negative?: string
  }>({})

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
      setPositive(initialPositive)
      setNegative(initialNegative)
      setAiSuggested(null)
      setErrors({})
      setIsSuggesting(false)
      setIsSubmitting(false)
    }
  }, [isOpen, initialContent, initialPositive, initialNegative])

  if (!isOpen) return null

  const theme = PEST_THEMES[dimension]
  const DimensionIcon = theme?.icon || Compass

  // التحقق قبل الحفظ
  const validate = () => {
    const errs: { content?: string; positive?: string; negative?: string } = {}
    if (!content.trim()) {
      errs.content = "نص البند (التوجه أو المؤشر) مطلوب."
    }
    if (!positive.trim()) {
      errs.positive = "الانعكاس الإيجابي والفرصة المرتبطة مطلوب."
    }
    if (!negative.trim()) {
      errs.negative = "الانعكاس السلبي والمخاطر المرتبطة مطلوب."
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSuggest = async () => {
    if (!content.trim() || content.trim().length < 3) {
      setErrors((prev) => ({
        ...prev,
        content: "اكتب نص البند أولاً (3 أحرف على الأقل) ليقترح الذكاء الاصطناعي انعكاسيه.",
      }))
      return
    }

    try {
      setIsSuggesting(true)
      const res = await onSuggest(content.trim())
      setPositive(res.positiveImplication)
      setNegative(res.negativeImplication)
      setAiSuggested({
        positive: res.positiveImplication,
        negative: res.negativeImplication,
      })
      // مسح الأخطاء الخاصة بالانعكاسين
      setErrors((prev) => ({ ...prev, positive: undefined, negative: undefined }))
    } catch {
      // handled by onSuggest toast
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)
      await onSubmit({
        content: content.trim(),
        positiveImplication: positive.trim(),
        negativeImplication: negative.trim(),
        aiSuggested,
      })
      onClose()
    } catch {
      // handled by onSubmit
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* الترويسة الملونة بحسب البُعد */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b border-slate-200/80 ${theme.headerBg}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs`}
            >
              <DimensionIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                إضافة بند جديد في {theme.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                يرتبط كل بند بتوجه وانعكاس إيجابي وسلبي يُحفظون معاً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-black/5 rounded-xl transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النموذج */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. نص البند (التوجه أو المؤشر) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-600" />
                <span>أ) نص البند (التوجه أو المؤشر)</span>
                <span className="text-rose-500">*</span>
              </label>

              {/* زر الاقتراح بالذكاء الاصطناعي */}
              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting || !content.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
                title="اقترح انعكاسين لهذا البند عبر الذكاء الاصطناعي"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    <span>جارٍ الاقتراح...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>اقتراح الانعكاسين بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={2}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (errors.content) setErrors((p) => ({ ...p, content: undefined }))
              }}
              placeholder="مثال: مبادرات التمكين الحكومي وتشجيع المنشآت الصغيرة والمتوسطة في الدولة..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none transition-all resize-none font-medium leading-relaxed ${
                errors.content
                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
            />
            {errors.content && (
              <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1 animate-fade-in">
                <span>⚠</span>
                <span>{errors.content}</span>
              </p>
            )}
          </div>

          {/* 2. الانعكاس الإيجابي (الفرصة) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
            <label className="block text-xs font-black text-emerald-900 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>ب) الانعكاس الإيجابي والفرصة المرتبطة بهذا البند</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={positive}
              onChange={(e) => {
                setPositive(e.target.value)
                if (errors.positive) setErrors((p) => ({ ...p, positive: undefined }))
              }}
              placeholder="مثال: فرص الاستفادة من مبادرات التمويل التنموي وحاضنات الأعمال الداعمة للمشروع..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none transition-all resize-none font-medium leading-relaxed bg-white ${
                errors.positive
                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                  : "border-emerald-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              }`}
            />
            {errors.positive && (
              <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1 animate-fade-in">
                <span>⚠</span>
                <span>{errors.positive}</span>
              </p>
            )}
          </div>

          {/* 3. الانعكاس السلبي (المخاطر) */}
          <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100">
            <label className="block text-xs font-black text-rose-900 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>ج) الانعكاس السلبي والمخاطر المرتبطة بهذا البند</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={negative}
              onChange={(e) => {
                setNegative(e.target.value)
                if (errors.negative) setErrors((p) => ({ ...p, negative: undefined }))
              }}
              placeholder="مثال: الالتزامات التنظيمية والرسوم المرتبطة بمتطلبات التوطين وتراخيص العمل..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none transition-all resize-none font-medium leading-relaxed bg-white ${
                errors.negative
                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                  : "border-rose-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              }`}
            />
            {errors.negative && (
              <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1 animate-fade-in">
                <span>⚠</span>
                <span>{errors.negative}</span>
              </p>
            )}
          </div>

          {/* تذييل الإجراءات */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4">
            <span className="text-[11px] text-slate-400 font-medium">
              تُحفظ البنود الثلاثة معاً في عملية متكاملة
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جارٍ الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ البند وانعكاسيه</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTrendModal
