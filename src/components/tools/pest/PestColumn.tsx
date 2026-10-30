import React, { useState } from "react"
import { Plus } from "lucide-react"
import { PestFactorRow } from "./PestFactorRow"
import { GenerateMenu } from "./GenerateMenu"
import type { PestFactor, PestDimension, PestCategory } from "@/types/pest"
import { CATEGORY_THEMES } from "@/config/pestTheme"

interface PestColumnProps {
  dimension: PestDimension
  category: PestCategory
  factors: PestFactor[]
  isGenerating?: boolean
  readOnly?: boolean
  highlightedParentId?: string | null
  parentTrendMap?: Map<string, number>
  missingImplicationsMap?: Map<string, ("positive_impact" | "negative_impact")[]>
  availableParentTrends?: Array<{ id: string; content: string; index: number }>
  onAddFactor: () => void
  onOpenAddTrendModal?: () => void
  onUpdateFactor: (factorId: string, content: string, parentFactorId?: string | null) => void
  onDeleteFactor: (factor: PestFactor) => void
  onMoveFactor: (factorId: string, direction: "up" | "down") => void
  onReorder: (newOrder: PestFactor[]) => void
  onGenerateCategory: (strategy: "replace" | "append") => void
  onHighlight?: (parentId: string | null) => void
  onAddMissingImplication?: (trendFactor: PestFactor, category: "positive_impact" | "negative_impact") => void
  onResuggestImplications?: (trendFactor: PestFactor) => void
  fullWidth?: boolean
}

export const PestColumn: React.FC<PestColumnProps> = ({
  dimension,
  category,
  factors,
  isGenerating = false,
  readOnly = false,
  highlightedParentId = null,
  parentTrendMap = new Map(),
  missingImplicationsMap = new Map(),
  availableParentTrends = [],
  onAddFactor,
  onOpenAddTrendModal,
  onUpdateFactor,
  onDeleteFactor,
  onMoveFactor,
  onReorder,
  onGenerateCategory,
  onHighlight,
  onAddMissingImplication,
  onResuggestImplications,
  fullWidth = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const theme = CATEGORY_THEMES[category]
  const Icon = theme.icon
  const isTrend = category === "trend"

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const updated = [...factors]
    const [moved] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, moved)

    setDraggedIndex(null)
    onReorder(updated)
  }

  const handleAddClick = () => {
    if (readOnly) return
    if (isTrend && onOpenAddTrendModal) {
      onOpenAddTrendModal()
    } else {
      onAddFactor()
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border ${theme.borderColor} bg-white/95 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-sm ${
        fullWidth ? "w-full" : "w-full"
      }`}
      dir="rtl"
    >
      {/* ترويسة العمود المميزة بأيقونة الفئة وألوانها */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 ${theme.headerBg} border-b ${theme.borderColor}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-6 h-6 rounded-lg ${theme.badgeBg} flex items-center justify-center shrink-0 border border-black/5`}>
            <Icon className={`w-3.5 h-3.5 ${theme.accentColor}`} />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-800">
              {theme.title}
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
              {factors.length}
            </span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 print:hidden">
            <GenerateMenu
              label="توليد العمود"
              isLoading={isGenerating}
              onGenerate={onGenerateCategory}
              compact
            />
          </div>
        )}
      </div>

      {/* قائمة البنود */}
      <div className="p-2.5 flex flex-col gap-2 min-h-[90px] flex-1">
        {factors.length === 0 ? (
          <div className="py-7 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80 my-1">
            <Icon className="w-6 h-6 text-slate-300 mb-1.5 opacity-60" />
            <p className="text-xs font-medium text-slate-500">{theme.emptyText}</p>
            {!readOnly && (
              <button
                type="button"
                onClick={handleAddClick}
                className="mt-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 px-3 py-1 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-lg transition-colors print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند جديد</span>
              </button>
            )}
          </div>
        ) : (
          factors.map((factor, idx) => {
            const isHighlighted =
              highlightedParentId !== null &&
              (isTrend
                ? factor.id === highlightedParentId
                : factor.parentFactorId === highlightedParentId)

            const parentIndex = factor.parentFactorId ? parentTrendMap.get(factor.parentFactorId) : null
            const missing = isTrend ? missingImplicationsMap.get(factor.id) || [] : []

            return (
              <PestFactorRow
                key={factor.id}
                factor={factor}
                index={idx}
                totalCount={factors.length}
                readOnly={readOnly}
                isHighlighted={isHighlighted}
                parentIndex={parentIndex}
                missingImplications={missing}
                availableParentTrends={availableParentTrends}
                onUpdate={(content, parentId) => onUpdateFactor(factor.id, content, parentId)}
                onDelete={() => onDeleteFactor(factor)}
                onMoveUp={() => onMoveFactor(factor.id, "up")}
                onMoveDown={() => onMoveFactor(factor.id, "down")}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                isDragging={draggedIndex === idx}
                onHighlight={onHighlight}
                onAddMissingImplication={(cat) => onAddMissingImplication && onAddMissingImplication(factor, cat)}
                onResuggestImplications={() => onResuggestImplications && onResuggestImplications(factor)}
              />
            )
          })
        )}

        {/* زر إضافة بند أسفل العمود */}
        {!readOnly && factors.length > 0 && (
          <button
            type="button"
            onClick={handleAddClick}
            className="w-full py-2 px-3 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-500 hover:text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 print:hidden mt-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة بند جديد</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default PestColumn
