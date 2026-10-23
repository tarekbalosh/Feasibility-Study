import React, { useState } from "react";
import { Sparkles, Loader2, X, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import type { GeneratePorterPayload } from "@/services/porter.service";

interface PorterAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (payload: GeneratePorterPayload) => Promise<unknown>;
  initialData?: {
    projectName?: string;
    projectDescription?: string;
    industry?: string;
    countryRegion?: string;
  };
}

export const PorterAiModal: React.FC<PorterAiModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialData,
}) => {
  const [projectName, setProjectName] = useState(initialData?.projectName || "");
  const [projectDescription, setProjectDescription] = useState(initialData?.projectDescription || "");
  const [industry, setIndustry] = useState(initialData?.industry || "");
  const [countryRegion, setCountryRegion] = useState(initialData?.countryRegion || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const descTrimmed = projectDescription.trim();
  const isValidDesc = descTrimmed.length >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDesc) return;

    try {
      setLoading(true);
      await onGenerate({
        projectName: projectName.trim() || undefined,
        projectDescription: descTrimmed,
        industry: industry.trim() || undefined,
        countryRegion: countryRegion.trim() || undefined,
      });
      onClose();
    } catch {
      // Error is toasted in the caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-50 via-indigo-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                التوليد الذكي لقوى بورتر الخمس
              </h3>
              <p className="text-xs text-slate-500">
                صِف مشروعك وسيتولى الذكاء الاصطناعي استنتاج القوى الخمس وانعكاساتها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المشروع
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="مثال: منصة رعاية صحية ذكية"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                القطاع أو النشاط
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="مثال: التقنية الطبية والصحية"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الدولة / السوق المستهدف
            </label>
            <input
              type="text"
              value={countryRegion}
              onChange={(e) => setCountryRegion(e.target.value)}
              placeholder="المملكة العربية السعودية"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                وصف المشروع ونشاطه <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                  descTrimmed.length === 0
                    ? "text-slate-400 bg-slate-100"
                    : descTrimmed.length < 15
                    ? "text-amber-700 bg-amber-50 border border-amber-200"
                    : "text-teal-700 bg-teal-50 border border-teal-200"
                }`}
              >
                {descTrimmed.length} / 15 حرفاً كحد أدنى
              </span>
            </div>

            <textarea
              rows={4}
              required
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="صِف طبيعة نشاط المشروع، القيمة المضافة، شرائح العملاء المستهدفة، والميزة التنافسية..."
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                descTrimmed.length > 0 && descTrimmed.length < 15
                  ? "border-amber-300 bg-amber-50/20 focus:ring-amber-500/20 focus:border-amber-500"
                  : descTrimmed.length >= 15
                  ? "border-teal-300 bg-teal-50/10 focus:ring-teal-500/20 focus:border-teal-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
            />

            <div className="mt-1.5 text-xs">
              {descTrimmed.length === 0 ? (
                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>يرجى إدخال 15 حرفاً على الأقل لتمكين التحليل الدقيق بالذكاء الاصطناعي.</span>
                </div>
              ) : descTrimmed.length < 15 ? (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>متبقٍ {15 - descTrimmed.length} أحرف لتفعيل زر التوليد.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>الوصف كافٍ، يمكنك الآن توليد القوى الخمس بالذكاء الاصطناعي.</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!isValidDesc || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 rounded-xl transition shadow-md shadow-teal-600/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ تحليل القطاع والتوليد...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>توليد القوى الخمس الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
