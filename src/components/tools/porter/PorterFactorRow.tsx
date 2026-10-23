import React, { useState, useEffect, useRef } from "react";
import {
  GripVertical,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Edit2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { PorterFactorItem } from "@/types/porter";

interface PorterFactorRowProps {
  factor: PorterFactorItem;
  index: number;
  totalCount: number;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export const PorterFactorRow: React.FC<PorterFactorRowProps> = ({
  factor,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
}) => {
  const isInitialEmpty = !factor.content || factor.content === "بند جديد...";
  const [content, setContent] = useState(isInitialEmpty ? "" : factor.content);
  const [isEditing, setIsEditing] = useState(isInitialEmpty);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const nextVal = factor.content === "بند جديد..." ? "" : factor.content || "";
    setContent(nextVal);
  }, [factor.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(
        textareaRef.current.scrollHeight,
        28
      )}px`;
    }
  }, [content, isEditing]);

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  const handleSave = () => {
    setIsEditing(false);
    const cleanCurrent = content.trim();
    const cleanOriginal =
      factor.content === "بند جديد..." ? "" : (factor.content || "").trim();
    if (cleanCurrent !== cleanOriginal) {
      onUpdate(cleanCurrent);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(factor.content === "بند جديد..." ? "" : factor.content || "");
  };

  const handleBlur = (e: React.FocusEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.closest(".group")?.contains(related)) {
      return;
    }
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={!isEditing ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group relative flex items-start gap-2.5 p-3 rounded-xl transition-all duration-200 border ${
        isDragging
          ? "opacity-40 bg-teal-50/50 border-dashed border-teal-400 scale-[0.99]"
          : isEditing
          ? "bg-white border-teal-300 ring-2 ring-teal-500/20 shadow-xs"
          : "bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
      }`}
      dir="rtl"
    >
      {/* Drag handle and move up/down */}
      <div className="flex items-center gap-0.5 shrink-0 pt-0.5 print:hidden">
        <span
          className={`p-1 rounded-md transition-colors ${
            isEditing
              ? "text-slate-200 cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 hover:bg-slate-100"
          }`}
          title="اسحب لإعادة الترتيب"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
        <div className="flex flex-col -space-y-0.5">
          <button
            type="button"
            disabled={index === 0 || isEditing}
            onClick={onMoveUp}
            className="p-0.5 text-slate-300 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-300 rounded hover:bg-slate-100 transition-colors"
            title="تحريك لأعلى"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={index === totalCount - 1 || isEditing}
            onClick={onMoveDown}
            className="p-0.5 text-slate-300 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-300 rounded hover:bg-slate-100 transition-colors"
            title="تحريك لأسفل"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Number badge */}
      <div
        className={`w-6 h-6 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 pt-0.5 select-none transition-colors ${
          isEditing
            ? "bg-teal-50 border border-teal-200 text-teal-700"
            : "bg-slate-100/80 border border-slate-200/70 text-slate-600 shadow-2xs"
        }`}
      >
        {index + 1}
      </div>

      {/* Editable Content */}
      <div className="flex-1 min-w-0" onClick={() => !isEditing && startEditing()}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          dir="rtl"
          autoFocus={isInitialEmpty}
          className={`w-full text-xs sm:text-[13px] font-medium leading-relaxed resize-none focus:outline-none rounded-lg p-1 transition-all placeholder:text-slate-400 placeholder:font-normal ${
            isEditing
              ? "text-slate-900 bg-white"
              : "text-slate-800 bg-transparent cursor-pointer hover:text-slate-900"
          }`}
          placeholder="بند جديد..."
        />
      </div>

      {/* Badges & Actions */}
      <div className="shrink-0 flex items-center gap-1.5 pt-0.5 print:hidden">
        {justSaved && !isEditing && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[10px] text-emerald-600 border border-emerald-200 font-bold animate-fade-in">
            <Check className="w-2.5 h-2.5 text-emerald-600" />
            <span>حُفظ</span>
          </span>
        )}

        {factor.source === "ai" && !justSaved && !isEditing && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-[10px] text-white font-bold shadow-xs select-none"
            title="بند مقترح بالذكاء الاصطناعي"
          >
            <Sparkles className="w-2.5 h-2.5 text-teal-100" />
            <span>AI</span>
          </span>
        )}

        {factor.source === "ai_edited" && !justSaved && !isEditing && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-[10px] text-purple-700 border border-purple-200 font-bold select-none"
            title="بند من الذكاء الاصطناعي تم تعديله يدوياً"
          >
            <Edit2 className="w-2.5 h-2.5" />
            <span>معدّل</span>
          </span>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
              title="حفظ التعديل (Enter)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>حفظ</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="إلغاء (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={startEditing}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-all"
              title="تعديل هذا البند"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="حذف هذا البند"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PorterFactorRow;
