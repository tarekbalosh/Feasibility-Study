import React from "react"
import { Check, X, Sparkles, CheckCheck, Trash2 } from "lucide-react"
import { PendingSuggestion } from "@/hooks/usePestEditor"
import { PEST_THEMES, CATEGORY_THEMES } from "@/config/pestTheme"

interface SuggestionCardsProps {
  suggestions: PendingSuggestion[]
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onAcceptAll: () => void
  onRejectAll: () => void
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}) => {
  if (suggestions.length === 0) return null

  return (
    <div
      className="mb-8 p-5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/50 rounded-3xl border border-indigo-200/80 shadow-md shadow-indigo-500/5 print:hidden backdrop-blur-xs"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>مقترحات الذكاء الاصطناعي الجديدة</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                {suggestions.length}
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              راجع البنود المقترحة أدناه: يمكنك قبول كل مقترح لإلحاقه بالجدول فوراً، أو تجاهله.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAcceptAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>قبول جميع المقترحات</span>
          </button>
          <button
            type="button"
            onClick={onRejectAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تجاهل الكل</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((sug) => {
          const dimTheme = PEST_THEMES[sug.dimension]
          const catTheme = CATEGORY_THEMES[sug.category]

          return (
            <div
              key={sug.id}
              className="bg-white/95 rounded-2xl p-4 border border-indigo-100/80 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${dimTheme.badgeBg}`}
                  >
                    {dimTheme.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    {catTheme.title}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
                  {sug.content}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onReject(sug.id)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                  title="تجاهل المقترح"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>تجاهل</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(sug.id)}
                  className="px-3 py-1 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                  title="قبول وإضافة إلى الجدول"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>قبول وإضافة</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SuggestionCards
