import React from "react";
import { Check, X, Sparkles, CheckCheck, Trash2 } from "lucide-react";
import type { PorterForceKey, PorterFieldKey } from "@/types/porter";
import { PORTER_FORCE_THEMES, PORTER_CATEGORY_THEMES } from "@/config/porterTheme";

export interface PendingPorterSuggestion {
  id: string;
  force: PorterForceKey;
  field: PorterFieldKey;
  content: string;
}

interface SuggestionCardsProps {
  suggestions: PendingPorterSuggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div
      className="mb-8 p-5 bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-indigo-50/50 rounded-3xl border border-teal-200/80 shadow-md shadow-teal-500/5 print:hidden backdrop-blur-xs"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/25">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>مقترحات الذكاء الاصطناعي الجديدة</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-xs font-bold">
                {suggestions.length}
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              راجع البنود المقترحة أدناه: يمكنك قبول كل مقترح لإلحاقه بالتحليل فوراً، أو تجاهله.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAcceptAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-sm hover:shadow-md transition-all"
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
          const forceTheme = PORTER_FORCE_THEMES[sug.force];
          const catTheme = PORTER_CATEGORY_THEMES[sug.field];

          return (
            <div
              key={sug.id}
              className="p-3.5 bg-white/95 rounded-2xl border border-teal-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${forceTheme?.badgeBg || "bg-slate-100"}`}
                  >
                    {forceTheme?.title || sug.force}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catTheme?.badgeBg || "bg-slate-100"}`}
                  >
                    {catTheme?.title || sug.field}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {sug.content}
                </p>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onReject(sug.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="تجاهل"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(sug.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionCards;
