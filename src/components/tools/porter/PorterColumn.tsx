import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PorterFactorRow } from "./PorterFactorRow";
import { GenerateMenu } from "./GenerateMenu";
import type {
  PorterFactorItem,
  PorterForceKey,
  PorterFieldKey,
} from "@/types/porter";
import { PORTER_CATEGORY_THEMES } from "@/config/porterTheme";

interface PorterColumnProps {
  force: PorterForceKey;
  field: PorterFieldKey;
  factors: PorterFactorItem[];
  isGenerating?: boolean;
  onAddFactor: () => void;
  onUpdateFactor: (factorId: string, content: string) => void;
  onDeleteFactor: (factorId: string) => void;
  onMoveFactor: (factorId: string, direction: "up" | "down") => void;
  onReorder: (newOrder: PorterFactorItem[]) => void;
  onGenerateCategory: (strategy: "replace" | "append") => void;
  fullWidth?: boolean;
}

export const PorterColumn: React.FC<PorterColumnProps> = ({
  force,
  field,
  factors,
  isGenerating = false,
  onAddFactor,
  onUpdateFactor,
  onDeleteFactor,
  onMoveFactor,
  onReorder,
  onGenerateCategory,
  fullWidth = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const theme = PORTER_CATEGORY_THEMES[field];
  const Icon = theme.icon;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...factors];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    onReorder(updated);
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border ${
        theme.borderColor
      } bg-white/95 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-sm ${
        fullWidth ? "w-full" : "w-full"
      }`}
      dir="rtl"
    >
      {/* Column Header */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 ${theme.headerBg} border-b ${theme.borderColor}`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-6 h-6 rounded-lg ${theme.badgeBg} flex items-center justify-center shrink-0 border border-black/5`}
          >
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

        <div className="flex items-center gap-1.5 print:hidden">
          <GenerateMenu
            label="توليد العمود"
            isLoading={isGenerating}
            onGenerate={onGenerateCategory}
            compact
          />
        </div>
      </div>

      {/* Factors List */}
      <div className="p-2.5 flex flex-col gap-2 min-h-[90px] flex-1">
        {factors.length === 0 ? (
          <div className="py-7 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80 my-1">
            <Icon className="w-6 h-6 text-slate-300 mb-1.5 opacity-60" />
            <p className="text-xs font-medium text-slate-500">{theme.emptyText}</p>
            <button
              type="button"
              onClick={onAddFactor}
              className="mt-2.5 text-xs font-bold text-teal-600 hover:text-teal-800 inline-flex items-center gap-1 px-3 py-1 bg-teal-50/70 hover:bg-teal-100/70 rounded-lg transition-colors print:hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة بند يدوياً</span>
            </button>
          </div>
        ) : (
          factors.map((factor, idx) => (
            <PorterFactorRow
              key={factor.id}
              factor={factor}
              index={idx}
              totalCount={factors.length}
              onUpdate={(content) => onUpdateFactor(factor.id, content)}
              onDelete={() => onDeleteFactor(factor.id)}
              onMoveUp={() => onMoveFactor(factor.id, "up")}
              onMoveDown={() => onMoveFactor(factor.id, "down")}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              isDragging={draggedIndex === idx}
            />
          ))
        )}

        {/* Add Factor Button at bottom */}
        {factors.length > 0 && (
          <button
            type="button"
            onClick={onAddFactor}
            className="w-full py-2 px-3 border border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-slate-500 hover:text-teal-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 print:hidden mt-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة بند جديد</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PorterColumn;
