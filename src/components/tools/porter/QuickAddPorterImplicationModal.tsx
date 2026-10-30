import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Shield,
} from "lucide-react";
import type { PorterForceKey, PorterFactorItem } from "@/types/porter";
import { PORTER_FORCE_THEMES } from "@/config/porterTheme";

interface QuickAddPorterImplicationModalProps {
  isOpen: boolean;
  force: PorterForceKey;
  parentFactor: PorterFactorItem | null;
  field: "positiveImpacts" | "negativeImpacts";
  onClose: () => void;
  onSubmit: (content: string, aiSuggested?: string) => Promise<void>;
  onSuggest: (trendContent: string) => Promise<{ positiveImplication: string; negativeImplication: string }>;
}

export const QuickAddPorterImplicationModal: React.FC<QuickAddPorterImplicationModalProps> = ({
  isOpen,
  force,
  parentFactor,
  field,
  onClose,
  onSubmit,
  onSuggest,
}) => {
  const [content, setContent] = useState("");
  const [aiSuggested, setAiSuggested] = useState<string | undefined>(undefined);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPositive = field === "positiveImpacts";
  const theme = PORTER_FORCE_THEMES[force];
  const ForceIcon = theme?.icon || Shield;

  useEffect(() => {
    if (isOpen) {
      setContent("");
      setAiSuggested(undefined);
      setError(null);
      setIsSuggesting(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !parentFactor) return null;

  const handleSuggest = async () => {
    try {
      setIsSuggesting(true);
      const res = await onSuggest(parentFactor.content);
      const text = isPositive ? res.positiveImplication : res.negativeImplication;
      setContent(text);
      setAiSuggested(text);
      setError(null);
    } catch {
      // handled elsewhere
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("نص الانعكاس مطلوب.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(content.trim(), aiSuggested);
      onClose();
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                إضافة {isPositive ? "انعكاس إيجابي (فرصة)" : "انعكاس سلبي (مخاطر)"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                في {theme?.title || "القوة التنافسية"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Parent trend card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              بند التوجه الأصلي:
            </span>
            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
              {parentFactor.content}
            </p>
          </div>

          {/* Implication input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  isPositive ? "text-emerald-900" : "text-rose-900"
                }`}
              >
                <span>نص الانعكاس</span>
                <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-200/80 transition-colors disabled:opacity-60"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                    <span>جارٍ الاقتراح...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>اقتراح بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                isPositive
                  ? "اكتب الانعكاس الإيجابي أو الفرصة المترتبة على هذا التوجه..."
                  : "اكتب الانعكاس السلبي أو المخاطر المترتبة على هذا التوجه..."
              }
              className={`w-full text-xs sm:text-[13px] font-medium p-3 rounded-xl border transition-all resize-none focus:outline-none ${
                error
                  ? "border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20"
                  : isPositive
                  ? "border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  : "border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white"
              }`}
            />
            {error && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 ${
                isPositive
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جارٍ الإضافة...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>إضافة الانعكاس</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
