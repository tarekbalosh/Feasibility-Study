import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Printer,
  Undo2,
  Check,
  Loader2,
  Edit3,
  Globe2,
  Layers,
  TrendingUp,
  AlertTriangle,
  Compass,
  Building,
  Tag,
  MapPin,
  Sparkles,
  BarChart3,
  Filter,
} from "lucide-react"
import { PestDimensionSection } from "./PestDimensionSection"
import { SuggestionCards } from "./SuggestionCards"
import { ConfirmDialog } from "./ConfirmDialog"
import { GenerateMenu } from "./GenerateMenu"
import { PestPrintDocument } from "./PestPrintDocument"
import { usePestEditor } from "@/hooks/usePestEditor"
import {
  DIMENSIONS_ORDER,
  CREATION_MODE_LABELS,
  type PestCategory,
  type PestDimension,
} from "@/types/pest"
import { PEST_THEMES } from "@/config/pestTheme"

interface PestTableProps {
  analysisId: string
  onBackToList?: () => void
}

export const PestTable: React.FC<PestTableProps> = ({
  analysisId,
  onBackToList,
}) => {
  const {
    analysis,
    loading,
    canEdit,
    saveState,
    generatingScopes,
    pendingSuggestions,
    canUndo,
    confirmDialog,
    highlightedParentId,
    setHighlightedParentId,
    updateMetadata,
    addFactor,
    addLinkedFactor,
    suggestImplications,
    addMissingImplication,
    updateFactor,
    deleteFactor,
    requestDeleteFactor,
    moveFactor,
    reorderFactors,
    triggerGenerate,
    acceptSuggestion,
    rejectSuggestion,
    acceptAllSuggestions,
    rejectAllSuggestions,
    undoLastGeneration,
    closeConfirmDialog,
  } = usePestEditor(analysisId)

  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaProject, setMetaProject] = useState("")
  const [metaDesc, setMetaDesc] = useState("")
  const [metaIndustry, setMetaIndustry] = useState("")
  const [metaRegion, setMetaRegion] = useState("")
  const [activeDimensionFilter, setActiveDimensionFilter] = useState<PestDimension | "all">("all")

  const openMetaModal = () => {
    if (!analysis) return
    setMetaTitle(analysis.title || "")
    setMetaProject(analysis.projectName || "")
    setMetaDesc(analysis.projectDescription || "")
    setMetaIndustry(analysis.industry || "")
    setMetaRegion(analysis.countryRegion || "")
    setIsEditingMeta(true)
  }

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditingMeta(false)
    await updateMetadata({
      title: metaTitle,
      projectName: metaProject,
      projectDescription: metaDesc,
      industry: metaIndustry,
      countryRegion: metaRegion,
    })
  }

  // حساب الإحصائيات الاستراتيجية الذكية
  const stats = useMemo(() => {
    if (!analysis) return { total: 0, positive: 0, negative: 0, trend: 0, aiCount: 0 }
    let total = 0
    let positive = 0
    let negative = 0
    let trend = 0
    let aiCount = 0

    for (const dim of DIMENSIONS_ORDER) {
      const dimData = analysis.factors[dim]
      if (!dimData) continue
      total += dimData.trend.length + dimData.positive_impact.length + dimData.negative_impact.length
      positive += dimData.positive_impact.length
      negative += dimData.negative_impact.length
      trend += dimData.trend.length

      for (const cat of ["trend", "positive_impact", "negative_impact"] as const) {
        for (const f of dimData[cat]) {
          if (f.source === "ai" || f.source === "ai_edited") aiCount++
        }
      }
    }

    return { total, positive, negative, trend, aiCount }
  }, [analysis])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" dir="rtl">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center animate-pulse">
            <Globe2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        </div>
        <p className="text-sm text-slate-600 font-bold">جارٍ تجهيز وتحميل تحليل PEST...</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <p className="text-base text-slate-800 font-bold">تعذّر العثور على تحليل PEST المطلوب أو أنه تم نقله.</p>
        <p className="text-xs text-slate-500 max-w-sm">يرجى التأكد من صحة الرابط أو اختيار التحليل من لوحة التحكم.</p>
        {onBackToList ? (
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-sm mt-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى قائمة التحليلات</span>
          </button>
        ) : (
          <Link
            href="/tools/pest"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-sm mt-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى قائمة التحليلات</span>
          </Link>
        )}
      </div>
    )
  }

  const modeBadge = CREATION_MODE_LABELS[analysis.creationMode]
  const isFullGenerating = generatingScopes.has("full")
  const filteredDimensions = activeDimensionFilter === "all" ? DIMENSIONS_ORDER : [activeDimensionFilter]

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8" dir="rtl">
      {/* ── 1. ترويسة التحليل الفاخرة (Hero Header Banner) ── */}
      <div className="mb-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm p-5 sm:p-6 print:hidden relative overflow-hidden">
        {/* هالة خلفية ناعمة */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* تفاصيل التحليل والمشروع */}
          <div className="flex items-start gap-4 min-w-0">
            {onBackToList ? (
              <button
                type="button"
                onClick={onBackToList}
                className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl border border-slate-200/70 transition-all shrink-0 mt-1 shadow-2xs"
                title="العودة إلى قائمة التحليلات"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <Link
                href="/tools/pest"
                className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl border border-slate-200/70 transition-all shrink-0 mt-1 shadow-2xs"
                title="العودة لقائمة التحليلات"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <Globe2 className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {analysis.title}
                </h1>
                {canEdit && (
                  <button
                    type="button"
                    onClick={openMetaModal}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="تعديل بيانات المشروع والتحليل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* شارات البيانات الوصفية */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                {analysis.projectName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/90 text-slate-800 font-bold border border-slate-200/60 shadow-2xs">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>مشروع: {analysis.projectName}</span>
                  </span>
                )}
                {analysis.industry && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/90 text-slate-700 font-bold border border-slate-200/60 shadow-2xs">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>القطاع: {analysis.industry}</span>
                  </span>
                )}
                {analysis.countryRegion && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/90 text-slate-700 font-bold border border-slate-200/60 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{analysis.countryRegion}</span>
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl border text-[11px] font-black shadow-2xs ${modeBadge.color}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>نمط: {modeBadge.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* شريط الإجراءات والتحكم */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
            {/* مؤشر الحفظ التلقائي */}
            {saveState === "saving" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100/90 border border-slate-200/80 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>جارٍ الحفظ...</span>
              </span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم الحفظ تلقائياً</span>
              </span>
            )}

            {/* زر التراجع عن آخر توليد */}
            {canEdit && canUndo && (
              <button
                type="button"
                onClick={undoLastGeneration}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shadow-2xs"
                title="تراجع عن آخر توليد واستعادة المحتوى السابق"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>تراجع عن التوليد</span>
              </button>
            )}

            {/* زر توليد التحليل بالكامل */}
            {canEdit && (
              <GenerateMenu
                label="توليد التحليل كاملاً"
                isLoading={isFullGenerating}
                onGenerate={(strat) => triggerGenerate("full", undefined, undefined, strat)}
                variant="primary"
              />
            )}

            {/* زر التصدير للطباعة / PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs hover:shadow-xs transition-all"
              title="طباعة التحليل أو تصديره كملف PDF"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>تصدير PDF / طباعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. لوحة المؤشرات الاستراتيجية (Strategic Metric Cards) ── */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        {/* إجمالي العوامل */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">إجمالي العوامل المرصودة</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">موزعة على 5 أبعاد رئيسية</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* التوجهات العامة */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">التوجهات والمؤشرات</span>
            <span className="text-2xl font-black text-sky-700 mt-1 block">{stats.trend}</span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">مسارات البيئة العامة</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        {/* الانعكاسات الإيجابية (الفرص) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">الانعكاسات الإيجابية (الفرص)</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.positive}</span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">نقاط القوة والدوافع</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* الانعكاسات السلبية (المخاطر) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block">الانعكاسات السلبية (التحديات)</span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.negative}</span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">عوامل تستوجب التحوط</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── 3. شريط التوازن الاستراتيجي المرئي ── */}
      {stats.total > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs print:hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>مؤشر التوازن الاستراتيجي للعوامل</span>
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>إيجابيات ({stats.positive})</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>توجهات ({stats.trend})</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>مخاطر ({stats.negative})</span>
              </span>
            </div>
          </div>
          {/* شريط النسب */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${(stats.positive / stats.total) * 100}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`إيجابيات: ${Math.round((stats.positive / stats.total) * 100)}%`}
            />
            <div
              style={{ width: `${(stats.trend / stats.total) * 100}%` }}
              className="bg-sky-500 transition-all duration-500"
              title={`توجهات: ${Math.round((stats.trend / stats.total) * 100)}%`}
            />
            <div
              style={{ width: `${(stats.negative / stats.total) * 100}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`مخاطر: ${Math.round((stats.negative / stats.total) * 100)}%`}
            />
          </div>
        </div>
      )}

      {/* ── 4. شريط تصفية الأبعاد (Dimension Quick Tabs) ── */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 print:hidden scrollbar-none">
        <span className="text-xs font-bold text-slate-400 ml-1 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>عرض:</span>
        </span>

        <button
          type="button"
          onClick={() => setActiveDimensionFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeDimensionFilter === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80"
          }`}
        >
          جميع الأبعاد (5)
        </button>

        {DIMENSIONS_ORDER.map((dim) => {
          const theme = PEST_THEMES[dim]
          const count =
            analysis.factors[dim].trend.length +
            analysis.factors[dim].positive_impact.length +
            analysis.factors[dim].negative_impact.length
          const isActive = activeDimensionFilter === dim

          return (
            <button
              key={dim}
              type="button"
              onClick={() => setActiveDimensionFilter(dim)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              <span>{theme.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 5. بطاقات الاقتراحات في وضع Append ── */}
      <SuggestionCards
        suggestions={pendingSuggestions}
        onAccept={acceptSuggestion}
        onReject={rejectSuggestion}
        onAcceptAll={acceptAllSuggestions}
        onRejectAll={rejectAllSuggestions}
      />

      {/* ── 6. أقسام الأبعاد الخمسة بالديزاين الجديد ── */}
      <div className="flex flex-col gap-6 print:hidden">
        {filteredDimensions.map((dim) => (
          <PestDimensionSection
            key={dim}
            dimension={dim}
            factors={analysis.factors[dim]}
            generatingScopes={generatingScopes}
            readOnly={!canEdit}
            highlightedParentId={highlightedParentId}
            onHighlight={setHighlightedParentId}
            onAddLinkedFactor={addLinkedFactor}
            onSuggestImplications={suggestImplications}
            onAddMissingImplication={addMissingImplication}
            onAddFactor={(cat: PestCategory) => addFactor(dim, cat)}
            onUpdateFactor={(cat: PestCategory, factorId: string, content: string, parentFactorId?: string | null) =>
              updateFactor(factorId, dim, cat, { content, parentFactorId })
            }
            onDeleteFactor={requestDeleteFactor}
            onMoveFactor={(cat: PestCategory, factorId: string, dir: "up" | "down") =>
              moveFactor(dim, cat, factorId, dir)
            }
            onReorder={(cat: PestCategory, newOrder) =>
              reorderFactors(dim, cat, newOrder)
            }
            onGenerateDimension={(strat) => triggerGenerate("dimension", dim, undefined, strat)}
            onGenerateCategory={(cat: PestCategory, strat) =>
              triggerGenerate("category", dim, cat, strat)
            }
          />
        ))}
      </div>

      {/* ── 7. مكوّن الطباعة وتصدير PDF ── */}
      <PestPrintDocument analysis={analysis} />

      {/* ── 8. حوار تأكيد استبدال البنود اليدوية ── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />

      {/* ── 9. نافذة تعديل بيانات التحليل والمشروع ── */}
      {isEditingMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                تعديل بيانات مشروع وتحليل PEST
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingMeta(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeta} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان التحليل *
                </label>
                <input
                  type="text"
                  required
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المشروع
                </label>
                <input
                  type="text"
                  value={metaProject}
                  onChange={(e) => setMetaProject(e.target.value)}
                  placeholder="مثال: مطعم البرركة"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    القطاع أو النشاط
                  </label>
                  <input
                    type="text"
                    value={metaIndustry}
                    onChange={(e) => setMetaIndustry(e.target.value)}
                    placeholder="مثال: أغذية ومطاعم"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الدولة / المنطقة الجغرافية
                  </label>
                  <input
                    type="text"
                    value={metaRegion}
                    onChange={(e) => setMetaRegion(e.target.value)}
                    placeholder="مثال: المملكة العربية السعودية"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  وصف مختصر للمشروع
                </label>
                <textarea
                  rows={3}
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  placeholder="نبذة عن المشروع لمساعدة الذكاء الاصطناعي في تقديم تحليلات دقيقة..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingMeta(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PestTable
