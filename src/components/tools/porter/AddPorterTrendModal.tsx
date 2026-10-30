import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Shield,
  Check,
  X,
  Loader2,
} from "lucide-react";
import type { PorterForceKey } from "@/types/porter";
import { PORTER_FORCE_THEMES } from "@/config/porterTheme";

interface AddPorterTrendModalProps {
  isOpen: boolean;
  force: PorterForceKey;
  initialContent?: string;
  initialPositive?: string;
  initialNegative?: string;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    positiveImplication: string;
    negativeImplication: string;
    aiSuggested?: { positive?: string; negative?: string } | null;
  }) => Promise<void>;
  onSuggest: (content: string) => Promise<{ positiveImplication: string; negativeImplication: string }>;
}

export const AddPorterTrendModal: React.FC<AddPorterTrendModalProps> = ({
  isOpen,
  force,
  initialContent = "",
  initialPositive = "",
  initialNegative = "",
  onClose,
  onSubmit,
  onSuggest,
}) => {
  const [content, setContent] = useState(initialContent);
  const [positive, setPositive] = useState(initialPositive);
  const [negative, setNegative] = useState(initialNegative);

  const [aiSuggested, setAiSuggested] = useState<{ positive?: string; negative?: string } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // رسائل التحقق بالعربية تحت كل حقل
  const [errors, setErrors] = useState<{
    content?: string;
    positive?: string;
    negative?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setPositive(initialPositive);
      setNegative(initialNegative);
      setAiSuggested(null);
      setErrors({});
      setIsSuggesting(false);
      setIsSubmitting(false);
    }
  }, [isOpen, initialContent, initialPositive, initialNegative]);

  if (!isOpen) return null;

  const theme = PORTER_FORCE_THEMES[force];
  const ForceIcon = theme?.icon || Shield;

  // التحقق قبل الحفظ
  const validate = () => {
    const errs: { content?: string; positive?: string; negative?: string } = {};
    if (!content.trim()) {
      errs.content = "نص البند (التوجه أو المؤشر) مطلوب.";
    }
    if (!positive.trim()) {
      errs.positive = "الانعكاس الإيجابي والفرصة المرتبطة مطلوب.";
    }
    if (!negative.trim()) {
      errs.negative = "الانعكاس السلبي والمخاطر المرتبطة مطلوب.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSuggest = async () => {
    if (!content.trim() || content.trim().length < 3) {
      setErrors((prev) => ({
        ...prev,
        content: "اكتب نص البند أولاً (3 أحرف على الأقل) ليقترح الذكاء الاصطناعي انعكاسيه.",
      }));
      return;
    }

    try {
      setIsSuggesting(true);
      const res = await onSuggest(content.trim());
      setPositive(res.positiveImplication);
      setNegative(res.negativeImplication);
      setAiSuggested({
        positive: res.positiveImplication,
        negative: res.negativeImplication,
      });
      setErrors((prev) => ({
        ...prev,
        positive: undefined,
        negative: undefined,
      }));
    } catch {
      // toast handled in parent
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        content: content.trim(),
        positiveImplication: positive.trim(),
        negativeImplication: negative.trim(),
        aiSuggested,
      });
      onClose();
    } catch {
      // toast handled in caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${theme?.iconBg || "bg-teal-600 text-white"} flex items-center justify-center shrink-0 shadow-sm`}>
              <ForceIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                إضافة بند جديد في {theme?.title || "القوة التنافسية"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                يرتبط كل بند بتوجه وانعكاس إيجابي وسلبي يُحفظون معاً
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Field 1: Trend text */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>أ) نص البند (التوجه أو المؤشر)</span>
                <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-200/80 transition-colors disabled:opacity-60"
                title="اقترح انعكاساً إيجابياً وسلبياً بالذكاء الاصطناعي استناداً لنص التوجه"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                    <span>جارٍ الاقتراح...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>اقتراح الانعكاسين بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={2}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              placeholder="مثال: نمو سريع في حجم الاستثمارات الموجهة لتطوير المنصات الرقمية وتسهيل التراخيص..."
              className={`w-full text-xs sm:text-[13px] font-medium p-3 rounded-xl border transition-all resize-none focus:outline-none ${
                errors.content
                  ? "border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20"
                  : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
              }`}
            />
            {errors.content && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{errors.content}</span>
              </p>
            )}
          </div>

          {/* Field 2: Positive implication */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>ب) الانعكاس الإيجابي والفرصة المرتبطة بهذا البند</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                يظهر في صندوق الفرص
              </span>
            </div>

            <textarea
              rows={2}
              value={positive}
              onChange={(e) => {
                setPositive(e.target.value);
                if (errors.positive) setErrors((prev) => ({ ...prev, positive: undefined }));
              }}
              placeholder="مثال: فرصة الاستفادة المبكرة من الحصة السوقية وبناء قاعدة عملاء قبل ازدحام المنافسين..."
              className={`w-full text-xs sm:text-[13px] font-medium p-3 rounded-xl border transition-all resize-none focus:outline-none ${
                errors.positive
                  ? "border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20"
                  : "border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
              }`}
            />
            {errors.positive && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{errors.positive}</span>
              </p>
            )}
          </div>

          {/* Field 3: Negative implication */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>ج) الانعكاس السلبي والمخاطر المرتبطة بهذا البند</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                يظهر في صندوق المخاطر
              </span>
            </div>

            <textarea
              rows={2}
              value={negative}
              onChange={(e) => {
                setNegative(e.target.value);
                if (errors.negative) setErrors((prev) => ({ ...prev, negative: undefined }));
              }}
              placeholder="مثال: ضغوط تسعيرية واشتداد المنافسة على الكفاءات مما يرفع تكاليف التشغيل..."
              className={`w-full text-xs sm:text-[13px] font-medium p-3 rounded-xl border transition-all resize-none focus:outline-none ${
                errors.negative
                  ? "border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20"
                  : "border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white"
              }`}
            />
            {errors.negative && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{errors.negative}</span>
              </p>
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 font-medium">
              تُحفظ البنود الثلاثة معاً في عملية متكاملة
            </span>

            <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
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
  );
};
