import React from "react"
import { SwotReportView } from "./report/SwotReportView"
import { SwotReportDocument } from "./report/SwotReportDocument"
import type { SwotAnalysis, SwotInput, SwotQuadrantKey } from "@/types/swot"

/**
 * ─────────────────────────────────────────────────────────────
 *  نتيجة تحليل SWOT — الحاوية
 * ─────────────────────────────────────────────────────────────
 *  مكوّنان يقرآن نفس البيانات ولا يتشاركان عنصراً تفاعلياً واحداً:
 *
 *    SwotReportView      → الشاشة: التقرير وأدوات التحكم والتعديل
 *    SwotReportDocument  → التصدير: التقرير وحده، صفر عناصر تفاعلية
 *
 *  الأول print:hidden والثاني hidden print:block، فما يُطبع هو
 *  المستند دون سواه.
 * ─────────────────────────────────────────────────────────────
 */

interface SwotResultProps {
  input: SwotInput
  analysis: SwotAnalysis
  onEditInput: () => void
  onEditSelection: () => void
  onRegenerate: () => void
  onReset: () => void
  removeItem: (quadrant: SwotQuadrantKey, index: number) => void
  editItem: (
    quadrant: SwotQuadrantKey,
    index: number,
    updates: { title: string; detail?: string }
  ) => void
}

export const SwotResult: React.FC<SwotResultProps> = ({
  input,
  analysis,
  onEditInput,
  onEditSelection,
  onRegenerate,
  onReset,
  removeItem,
  editItem,
}) => (
  <>
    <SwotReportView
      input={input}
      analysis={analysis}
      onEditInput={onEditInput}
      onEditSelection={onEditSelection}
      onRegenerate={onRegenerate}
      onReset={onReset}
      removeItem={removeItem}
      editItem={editItem}
    />
    <SwotReportDocument input={input} analysis={analysis} />
  </>
)

export default SwotResult
