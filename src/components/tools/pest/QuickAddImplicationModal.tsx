import React, { useState, useEffect } from "react"
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Loader2,
} from "lucide-react"
import type { PestFactor, PestDimension } from "@/types/pest"
import { PEST_THEMES } from "@/config/pestTheme"

interface QuickAddImplicationModalProps {
  isOpen: boolean
  dimension: PestDimension
  parentFactor: PestFactor | null
  category: "positive_impact" | "negative_impact"
  onClose: () => void
  onSubmit: (content: string, aiSuggested?: string) => Promise<void>
  onSuggest: (trendContent: string) => Promise<{ positiveImplication: string; negativeImplication: string }>
}

export const QuickAddImplicationModal: React.FC<QuickAddImplicationModalProps> = ({
  isOpen,
  dimension,
  parentFactor,
  category,
  onClose,
  onSubmit,
  onSuggest,
}) => {
  const [content, setContent] = useState("")
  const [aiSuggested, setAiSuggested] = useState<string | undefined>(undefined)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPositive = category === "positive_impact"
  const theme = PEST_THEMES[dimension]

  useEffect(() => {
    if (isOpen) {
      setContent("")
      setAiSuggested(undefined)
      setError(null)
      setIsSuggesting(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || !parentFactor) return null

  const handleSuggest = async () => {
    try {
      setIsSuggesting(true)
      const res = await onSuggest(parentFactor.content)
      const text = isPositive ? res.positiveImplication : res.negativeImplication
      setContent(text)
      setAiSuggested(text)
      setError(null)
    } catch {
      // handled elsewhere
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError("نص الانعكاس مطلوب.")
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(content.trim(), aiSuggested)
      onClose()
    } catch {
      // handled
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* الترويسة */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 ${theme.headerBg}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                إضافة {isPositive ? "انعكاس إيجابي (فرصة)" : "انعكاس سلبي (مخاطر)"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                تابع للبند: «{parentFactor.content.slice(0, 50)}...»
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                نص الانعكاس <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-lg transition-all shadow-2xs"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    <span>جارٍ الاقتراح...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>اقتراح بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (error) setError(null)
              }}
              placeholder={
                isPositive
                  ? "اكتب الفرصة أو الانعكاس الإيجابي الناتج عن هذا البند..."
                  : "اكتب المخاطر أو الانعكاس السلبي الناتج عن هذا البند..."
              }
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none transition-all resize-none font-medium leading-relaxed ${
                error
                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                  : isPositive
                  ? "border-emerald-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  : "border-rose-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              }`}
            />
            {error && (
              <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                <span>⚠</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                  <span>حفظ الانعكاس</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuickAddImplicationModal
