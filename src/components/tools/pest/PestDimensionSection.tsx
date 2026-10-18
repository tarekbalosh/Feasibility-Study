import React from "react"
import { PestColumn } from "./PestColumn"
import { GenerateMenu } from "./GenerateMenu"
import type { PestDimension, PestCategory, PestFactor } from "@/types/pest"
import { PEST_THEMES } from "@/config/pestTheme"

interface PestDimensionSectionProps {
  dimension: PestDimension
  factors: Record<PestCategory, PestFactor[]>
  generatingScopes: Set<string>
  onAddFactor: (category: PestCategory) => void
  onUpdateFactor: (category: PestCategory, factorId: string, content: string) => void
  onDeleteFactor: (category: PestCategory, factorId: string) => void
  onMoveFactor: (category: PestCategory, factorId: string, direction: "up" | "down") => void
  onReorder: (category: PestCategory, newOrder: PestFactor[]) => void
  onGenerateDimension: (strategy: "replace" | "append") => void
  onGenerateCategory: (category: PestCategory, strategy: "replace" | "append") => void
}

export const PestDimensionSection: React.FC<PestDimensionSectionProps> = ({
  dimension,
  factors,
  generatingScopes,
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

        <div className="flex items-center gap-2 print:hidden relative z-10">
          <GenerateMenu
            label="توليد البُعد"
            isLoading={isDimGenerating}
            onGenerate={onGenerateDimension}
          />
        </div>
      </div>

      {/* شبكة الأعمدة الثلاثة: التوجهات بعرض كامل ثم العمودان المتقابلان */}
      <div className="relative p-4 sm:p-5 flex flex-col gap-4">
        {/* أبرز التوجهات والمؤشرات — بعرض كامل */}
        <PestColumn
          dimension={dimension}
          category="trend"
          factors={factors.trend}
          isGenerating={generatingScopes.has(`cat:${dimension}:trend`) || isDimGenerating}
          onAddFactor={() => onAddFactor("trend")}
          onUpdateFactor={(id, content) => onUpdateFactor("trend", id, content)}
          onDeleteFactor={(id) => onDeleteFactor("trend", id)}
          onMoveFactor={(id, dir) => onMoveFactor("trend", id, dir)}
          onReorder={(list) => onReorder("trend", list)}
          onGenerateCategory={(strat) => onGenerateCategory("trend", strat)}
          fullWidth
        />

        {/* الانعكاسات الإيجابية (الفرص) والسلبيات (المخاطر) — عمودان متجاوران */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PestColumn
            dimension={dimension}
            category="positive_impact"
            factors={factors.positive_impact}
            isGenerating={generatingScopes.has(`cat:${dimension}:positive_impact`) || isDimGenerating}
            onAddFactor={() => onAddFactor("positive_impact")}
            onUpdateFactor={(id, content) => onUpdateFactor("positive_impact", id, content)}
            onDeleteFactor={(id) => onDeleteFactor("positive_impact", id)}
            onMoveFactor={(id, dir) => onMoveFactor("positive_impact", id, dir)}
            onReorder={(list) => onReorder("positive_impact", list)}
            onGenerateCategory={(strat) => onGenerateCategory("positive_impact", strat)}
          />

          <PestColumn
            dimension={dimension}
            category="negative_impact"
            factors={factors.negative_impact}
            isGenerating={generatingScopes.has(`cat:${dimension}:negative_impact`) || isDimGenerating}
            onAddFactor={() => onAddFactor("negative_impact")}
            onUpdateFactor={(id, content) => onUpdateFactor("negative_impact", id, content)}
            onDeleteFactor={(id) => onDeleteFactor("negative_impact", id)}
            onMoveFactor={(id, dir) => onMoveFactor("negative_impact", id, dir)}
            onReorder={(list) => onReorder("negative_impact", list)}
            onGenerateCategory={(strat) => onGenerateCategory("negative_impact", strat)}
          />
        </div>
      </div>
    </section>
  )
}

export default PestDimensionSection
