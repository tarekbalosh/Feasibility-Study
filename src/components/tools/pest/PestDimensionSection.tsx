import React, { useState, useMemo } from "react"
import { PestColumn } from "./PestColumn"
import { GenerateMenu } from "./GenerateMenu"
import { AddTrendModal } from "./AddTrendModal"
import { QuickAddImplicationModal } from "./QuickAddImplicationModal"
import type { PestDimension, PestCategory, PestFactor } from "@/types/pest"
import { PEST_THEMES } from "@/config/pestTheme"

interface PestDimensionSectionProps {
  dimension: PestDimension
  factors: Record<PestCategory, PestFactor[]>
  generatingScopes: Set<string>
  readOnly?: boolean
  highlightedParentId?: string | null
  onHighlight?: (parentId: string | null) => void
  onAddLinkedFactor: (payload: {
    dimension: PestDimension
    content: string
    positiveImplication: string
    negativeImplication: string
    aiSuggested?: { positive?: string; negative?: string } | null
  }) => Promise<any>
  onSuggestImplications: (dimension: PestDimension, content: string) => Promise<{ positiveImplication: string; negativeImplication: string }>
  onAddMissingImplication: (
    parentFactorId: string,
    dimension: PestDimension,
    category: "positive_impact" | "negative_impact",
    content: string,
    aiSuggested?: string
  ) => Promise<any>
  onAddFactor: (category: PestCategory) => void
  onUpdateFactor: (category: PestCategory, factorId: string, content: string, parentFactorId?: string | null) => void
  onDeleteFactor: (factor: PestFactor) => void
  onMoveFactor: (category: PestCategory, factorId: string, direction: "up" | "down") => void
  onReorder: (category: PestCategory, newOrder: PestFactor[]) => void
  onGenerateDimension: (strategy: "replace" | "append") => void
  onGenerateCategory: (category: PestCategory, strategy: "replace" | "append") => void
}

export const PestDimensionSection: React.FC<PestDimensionSectionProps> = ({
  dimension,
  factors,
  generatingScopes,
  readOnly = false,
  highlightedParentId = null,
  onHighlight,
  onAddLinkedFactor,
  onSuggestImplications,
  onAddMissingImplication,
  onAddFactor,
  onUpdateFactor,
  onDeleteFactor,
  onMoveFactor,
  onReorder,
  onGenerateDimension,
  onGenerateCategory,
}) => {
  const theme = PEST_THEMES[dimension]
  const DimensionIcon = theme.icon
  const isDimGenerating = generatingScopes.has(`dim:${dimension}`) || generatingScopes.has("full")
  const totalFactorsCount =
    factors.trend.length + factors.positive_impact.length + factors.negative_impact.length

  // حالة نموذج إضافة بند جديد
  const [isAddTrendOpen, setIsAddTrendOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState<{
    content?: string
    positive?: string
    negative?: string
  }>({})

  // حالة نموذج إضافة انعكاس سريع
  const [quickAddTarget, setQuickAddTarget] = useState<{
    trend: PestFactor
    category: "positive_impact" | "negative_impact"
  } | null>(null)

  // خريطة فهارس التوجهات للأبناء
  const parentTrendMap = useMemo(() => {
    const map = new Map<string, number>()
    factors.trend.forEach((t, idx) => {
      map.set(t.id, idx)
    })
    return map
  }, [factors.trend])

  // خريطة الانعكاسات الناقصة لكل بند توجه
  const missingImplicationsMap = useMemo(() => {
    const map = new Map<string, ("positive_impact" | "negative_impact")[]>()
    const posParentIds = new Set(factors.positive_impact.filter((f) => f.parentFactorId).map((f) => f.parentFactorId!))
    const negParentIds = new Set(factors.negative_impact.filter((f) => f.parentFactorId).map((f) => f.parentFactorId!))

    factors.trend.forEach((t) => {
      const missing: ("positive_impact" | "negative_impact")[] = []
      if (!posParentIds.has(t.id)) missing.push("positive_impact")
      if (!negParentIds.has(t.id)) missing.push("negative_impact")
      if (missing.length > 0) map.set(t.id, missing)
    })
    return map
  }, [factors.trend, factors.positive_impact, factors.negative_impact])

  // قائمة التوجهات المتاحة للربط
  const availableParentTrends = useMemo(() => {
    return factors.trend.map((t, idx) => ({
      id: t.id,
      content: t.content,
      index: idx,
    }))
  }, [factors.trend])

  // إعادة اقتراح الانعكاسين لبند توجه قائم
  const handleResuggestForTrend = (trendFactor: PestFactor) => {
    const existingPos = factors.positive_impact.find((f) => f.parentFactorId === trendFactor.id)?.content || ""
    const existingNeg = factors.negative_impact.find((f) => f.parentFactorId === trendFactor.id)?.content || ""

    setModalInitial({
      content: trendFactor.content,
      positive: existingPos,
      negative: existingNeg,
    })
    setIsAddTrendOpen(true)
  }

  return (
    <section
      className={`rounded-3xl border ${theme.border} bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative`}
      dir="rtl"
    >
      {/* لمسة لونية خفيفة في الخلفية */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.gradientLight} pointer-events-none`} />

      {/* ترويسة البُعد الفاخرة */}
      <div
        className={`relative px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 ${theme.headerBg}`}
      >
        <div className="flex items-center gap-3.5">
          {/* أيقونة البعد المتوهجة */}
          <div className={`w-11 h-11 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105`}>
            <DimensionIcon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {theme.title}
              </h3>
              <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-500 uppercase">
                {theme.englishLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{totalFactorsCount} بنود</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block font-medium">
              {theme.subtitle}
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 print:hidden relative z-10">
            <GenerateMenu
              label="توليد البُعد"
              isLoading={isDimGenerating}
              onGenerate={onGenerateDimension}
            />
          </div>
        )}
      </div>

      {/* شبكة الأعمدة الثلاثة: التوجهات بعرض كامل ثم العمودان المتقابلان */}
      <div className="relative p-4 sm:p-5 flex flex-col gap-4">
        {/* أبرز التوجهات والمؤشرات — بعرض كامل */}
        <PestColumn
          dimension={dimension}
          category="trend"
          factors={factors.trend}
          isGenerating={generatingScopes.has(`cat:${dimension}:trend`) || isDimGenerating}
          readOnly={readOnly}
          highlightedParentId={highlightedParentId}
          parentTrendMap={parentTrendMap}
          missingImplicationsMap={missingImplicationsMap}
          availableParentTrends={availableParentTrends}
          onAddFactor={() => {
            setModalInitial({})
            setIsAddTrendOpen(true)
          }}
          onOpenAddTrendModal={() => {
            setModalInitial({})
            setIsAddTrendOpen(true)
          }}
          onUpdateFactor={(id, content, parentId) => onUpdateFactor("trend", id, content, parentId)}
          onDeleteFactor={onDeleteFactor}
          onMoveFactor={(id, dir) => onMoveFactor("trend", id, dir)}
          onReorder={(list) => onReorder("trend", list)}
          onGenerateCategory={(strat) => onGenerateCategory("trend", strat)}
          onHighlight={onHighlight}
          onAddMissingImplication={(trend, cat) => setQuickAddTarget({ trend, category: cat })}
          onResuggestImplications={handleResuggestForTrend}
          fullWidth
        />

        {/* الانعكاسات الإيجابية (الفرص) والسلبيات (المخاطر) — عمودان متجاوران */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PestColumn
            dimension={dimension}
            category="positive_impact"
            factors={factors.positive_impact}
            isGenerating={generatingScopes.has(`cat:${dimension}:positive_impact`) || isDimGenerating}
            readOnly={readOnly}
            highlightedParentId={highlightedParentId}
            parentTrendMap={parentTrendMap}
            missingImplicationsMap={missingImplicationsMap}
            availableParentTrends={availableParentTrends}
            onAddFactor={() => onAddFactor("positive_impact")}
            onUpdateFactor={(id, content, parentId) => onUpdateFactor("positive_impact", id, content, parentId)}
            onDeleteFactor={onDeleteFactor}
            onMoveFactor={(id, dir) => onMoveFactor("positive_impact", id, dir)}
            onReorder={(list) => onReorder("positive_impact", list)}
            onGenerateCategory={(strat) => onGenerateCategory("positive_impact", strat)}
            onHighlight={onHighlight}
          />

          <PestColumn
            dimension={dimension}
            category="negative_impact"
            factors={factors.negative_impact}
            isGenerating={generatingScopes.has(`cat:${dimension}:negative_impact`) || isDimGenerating}
            readOnly={readOnly}
            highlightedParentId={highlightedParentId}
            parentTrendMap={parentTrendMap}
            missingImplicationsMap={missingImplicationsMap}
            availableParentTrends={availableParentTrends}
            onAddFactor={() => onAddFactor("negative_impact")}
            onUpdateFactor={(id, content, parentId) => onUpdateFactor("negative_impact", id, content, parentId)}
            onDeleteFactor={onDeleteFactor}
            onMoveFactor={(id, dir) => onMoveFactor("negative_impact", id, dir)}
            onReorder={(list) => onReorder("negative_impact", list)}
            onGenerateCategory={(strat) => onGenerateCategory("negative_impact", strat)}
            onHighlight={onHighlight}
          />
        </div>
      </div>

      {/* نموذج إضافة بند جديد مع انعكاسيه */}
      {!readOnly && (
        <AddTrendModal
          isOpen={isAddTrendOpen}
          dimension={dimension}
          initialContent={modalInitial.content}
          initialPositive={modalInitial.positive}
          initialNegative={modalInitial.negative}
          onClose={() => setIsAddTrendOpen(false)}
          onSubmit={async (data) => {
            await onAddLinkedFactor({
              dimension,
              ...data,
            })
          }}
          onSuggest={(text) => onSuggestImplications(dimension, text)}
        />
      )}

      {/* نموذج إضافة انعكاس سريع للبند الناقص */}
      {!readOnly && (
        <QuickAddImplicationModal
          isOpen={quickAddTarget !== null}
          dimension={dimension}
          parentFactor={quickAddTarget?.trend || null}
          category={quickAddTarget?.category || "positive_impact"}
          onClose={() => setQuickAddTarget(null)}
          onSubmit={async (content, aiSuggested) => {
            if (quickAddTarget) {
              await onAddMissingImplication(
                quickAddTarget.trend.id,
                dimension,
                quickAddTarget.category,
                content,
                aiSuggested
              )
            }
          }}
          onSuggest={(text) => onSuggestImplications(dimension, text)}
        />
      )}
    </section>
  )
}

export default PestDimensionSection
