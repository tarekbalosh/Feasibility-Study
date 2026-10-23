import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import {
  Shield,
  Sparkles,
  PenTool,
  Clock,
  ArrowLeft,
  Trash2,
  Copy,
  FolderOpen,
  Loader2,
  Plus,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import porterService, { CreatePorterPayload } from "@/services/porter.service";
import type { PorterAnalysisSummary } from "@/types/porter";
import { CREATION_MODE_LABELS } from "@/types/porter";

interface PorterStartProps {
  onSelectAnalysis: (id: string) => void;
}

export const PorterStart: React.FC<PorterStartProps> = ({ onSelectAnalysis }) => {
  const router = useRouter();
  const planId = typeof router.query.planId === "string" ? router.query.planId : undefined;
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [createMode, setCreateMode] = useState<"manual" | "ai">("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("");
  const [countryRegion, setCountryRegion] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // History list
  const [history, setHistory] = useState<PorterAnalysisSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const list = await porterService.list();
      setHistory(list);
    } catch {
      // Silent on first load
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle =
      title.trim() ||
      (projectName.trim()
        ? `تحليل قوى بورتر - ${projectName.trim()}`
        : "تحليل قوى بورتر جديد");

    try {
      setIsSubmitting(true);
      const payload: CreatePorterPayload = {
        title: cleanTitle,
        projectName: projectName.trim() || undefined,
        industry: industry.trim() || undefined,
        countryRegion: countryRegion.trim() || undefined,
        projectDescription: projectDescription.trim() || undefined,
        planId,
        mode: "manual",
      };

      const created = await porterService.create(payload);
      toast.success("تم إنشاء التحليل اليدوي بنجاح.");
      onSelectAnalysis(created.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "تعذّر إنشاء التحليل.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDescription.trim() || projectDescription.trim().length < 15) {
      toast.error("يرجى كتابة وصف موجز للمشروع (15 حرفاً على الأقل) لمساعدة الذكاء الاصطناعي.");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading("جارٍ استدعاء الذكاء الاصطناعي لتوليد القوى الخمس...", { id: "porter-gen" });

      // Call generate first
      const genRes = await porterService.generate({
        projectName: projectName.trim() || undefined,
        projectDescription: projectDescription.trim(),
        industry: industry.trim() || undefined,
        countryRegion: countryRegion.trim() || undefined,
      });

      const analysisTitle =
        title.trim() ||
        (projectName.trim()
          ? `تحليل قوى بورتر - ${projectName.trim()}`
          : "تحليل قوى بورتر (توليد ذكي)");

      // Save initial analysis with generated forces
      const created = await porterService.create({
        title: analysisTitle,
        projectName: projectName.trim() || undefined,
        industry: industry.trim() || undefined,
        countryRegion: countryRegion.trim() || undefined,
        projectDescription: projectDescription.trim(),
        planId,
        mode: "ai",
        forces: genRes.forces,
      });

      toast.success("تم توليد التحليل بالكامل وحفظه بنجاح!", { id: "porter-gen" });
      onSelectAnalysis(created.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "تعذّر إنشاء التحليل.", {
        id: "porter-gen",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا التحليل نهائياً؟")) return;

    try {
      await porterService.delete(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("تم حذف التحليل بنجاح.");
    } catch {
      toast.error("فشل حذف التحليل.");
    }
  };

  const handleDuplicate = async (item: PorterAnalysisSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.loading("جارٍ نسخ التحليل...", { id: "dup" });
      const original = await porterService.get(item.id);
      const copy = await porterService.create({
        title: `نسخة من ${original.title}`,
        projectName: original.projectName || undefined,
        industry: original.industry || undefined,
        countryRegion: original.countryRegion || undefined,
        projectDescription: original.projectDescription || undefined,
        planId,
        mode: original.creationMode,
        forces: original.forces,
      });

      toast.success("تم نسخ التحليل بنجاح!", { id: "dup" });
      loadHistory();
      onSelectAnalysis(copy.id);
    } catch {
      toast.error("فشل نسخ التحليل.", { id: "dup" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* ── Header ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-4 shadow-sm">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          أداة تحليل قوى بورتر الخمس — البيئة التنافسية
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          حلل البيئة التنافسية لقطاعك وقس مدى جاذبيته عبر قوى بورتر الخمس: المنافسون الجدد،
          العملاء، الموردون، المنتجات البديلة، والمنافسة القائمة — يدوياً أو بمساعدة الذكاء الاصطناعي.
        </p>

        {/* Tab switchers: Create vs History */}
        <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`px-5 py-2 rounded-lg transition-all ${
              activeTab === "create"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            إنشاء تحليل جديد
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>التحليلات السابقة</span>
            {history.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "create" ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10">
          {/* Choice between Manual and AI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setCreateMode("manual")}
              className={`p-5 rounded-2xl border-2 text-right transition-all flex items-start gap-4 ${
                createMode === "manual"
                  ? "border-teal-500 bg-teal-50/30 shadow-md ring-2 ring-teal-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  createMode === "manual"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  ابدأ بتحليل فارغ (إدخال يدوي)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  هيكل متكامل للقوى الخمس وحقولها جاهز للكتابة المباشرة خطوة بخطوة.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCreateMode("ai")}
              className={`p-5 rounded-2xl border-2 text-right transition-all flex items-start gap-4 ${
                createMode === "ai"
                  ? "border-indigo-500 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  createMode === "ai"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  ولّد التحليل بالذكاء الاصطناعي
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  أدخل وصف مشروعك وسيتولى الذكاء الاصطناعي صياغة المؤشرات والانعكاسات للقوى الخمس.
                </p>
              </div>
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={createMode === "manual" ? handleCreateManual : handleCreateAI}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان التحليل
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="تحليل قوى بورتر جديد"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المشروع {createMode === "ai" && <span className="text-slate-400">(اختياري)</span>}
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="مثال: تطبيق توصيل سريع"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm font-medium"
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
                  placeholder="مثال: الخدمات اللوجستية، التجارة الإلكترونية"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الدولة / المنطقة الجغرافية المستهدفة
              </label>
              <input
                type="text"
                value={countryRegion}
                onChange={(e) => setCountryRegion(e.target.value)}
                placeholder="المملكة العربية السعودية"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm placeholder:text-slate-400 font-medium"
              />
            </div>

            {createMode === "ai" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    وصف المشروع ونشاطه <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md transition-colors ${
                      projectDescription.trim().length === 0
                        ? "text-slate-400 bg-slate-100"
                        : projectDescription.trim().length < 15
                        ? "text-amber-700 bg-amber-50 border border-amber-200"
                        : "text-teal-700 bg-teal-50 border border-teal-200"
                    }`}
                  >
                    {projectDescription.trim().length} / 15 حرفاً كحد أدنى
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="صِف فكرة مشروعك، طبيعة المنتجات/الخدمات، الجمهور المستهدف، والميزة التنافسية..."
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 shadow-sm transition-all font-medium resize-none ${
                    projectDescription.length > 0 && projectDescription.trim().length < 15
                      ? "border-amber-300 bg-amber-50/20 focus:ring-amber-500/20 focus:border-amber-500"
                      : projectDescription.trim().length >= 15
                      ? "border-teal-300 bg-teal-50/10 focus:ring-teal-500/20 focus:border-teal-500"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                />
                <div className="mt-1.5 text-xs">
                  {projectDescription.trim().length === 0 ? (
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                      <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        ملاحظة: أدخل 15 حرفاً على الأقل لتمكين التوليد بالذكاء الاصطناعي.
                      </span>
                    </div>
                  ) : projectDescription.trim().length < 15 ? (
                    <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        متبقٍ <strong>{15 - projectDescription.trim().length}</strong> أحرف للاستكمال.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>الوصف كافٍ، يمكنك الآن بدء التوليد.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {createMode === "manual"
                  ? "✓ يمكنك في أي وقت الاستعانة بالذكاء الاصطناعي لاحقاً داخل الجدول."
                  : "✓ يمكنك مراجعة وتعديل أي حقل بعد التوليد بحرية."}
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
                  createMode === "manual"
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ التجهيز...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {createMode === "manual"
                        ? "فتح الجدول والبدء"
                        : "توليد بالذكاء الاصطناعي"}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              التحليلات المحفوظة في مساحة العمل
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تحليل جديد</span>
            </button>
          </div>

          {historyLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-xs text-slate-500">جارٍ جلب التحليلات...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-sm font-bold text-slate-700">لا توجد تحليلات سابقة لقوى بورتر</p>
              <p className="text-xs mt-1">ابدأ بإنشاء أول تحليل لمشروعك الآن.</p>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className="mt-4 px-4 py-2 text-xs font-bold text-teal-600 hover:bg-teal-50 rounded-xl border border-teal-200"
              >
                + إنشاء تحليل جديد
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((item) => {
                const modeMeta = CREATION_MODE_LABELS[item.creationMode];
                const dateStr = new Date(item.updatedAt || item.createdAt).toLocaleDateString("ar-SA");

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAnalysis(item.id)}
                    className="py-4 px-2 hover:bg-slate-50/80 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          {item.projectName && (
                            <span className="text-slate-600 font-medium">
                              مشروع: {item.projectName}
                            </span>
                          )}
                          <span>• {item.filledFields} من {item.totalFields} حقلاً معبّأ</span>
                          <span>• {dateStr}</span>
                          {item.creationMode === "ai" ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200"
                              title="ذكاء اصطناعي"
                            >
                              <Sparkles className="w-3 h-3" />
                            </span>
                          ) : modeMeta ? (
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${modeMeta.color}`}
                            >
                              {modeMeta.label}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(item, e)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="نسخ هذا التحليل"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف التحليل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PorterStart;
