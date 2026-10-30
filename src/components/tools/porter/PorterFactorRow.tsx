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
  Link as LinkIcon,
  PlusCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { PorterFactorItem } from "@/types/porter";

interface PorterFactorRowProps {
  factor: PorterFactorItem;
  index: number;
  totalCount: number;
  readOnly?: boolean;
  isHighlighted?: boolean;
  parentIndex?: number | null;
  missingImplications?: ("positiveImpacts" | "negativeImpacts")[];
  availableParentTrends?: Array<{ id: string; content: string; index: number }>;
  onUpdate: (content: string, parentFactorId?: string | null) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  onHighlight?: (parentId: string | null) => void;
  onAddMissingImplication?: (field: "positiveImpacts" | "negativeImpacts") => void;
  onResuggestImplications?: () => void;
}

export const PorterFactorRow: React.FC<PorterFactorRowProps> = ({
  factor,
  index,
  totalCount,
  readOnly = false,
  isHighlighted = false,
  parentIndex = null,
  missingImplications = [],
  availableParentTrends = [],
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  onHighlight,
  onAddMissingImplication,
  onResuggestImplications,
}) => {
  const isInitialEmpty = !factor.content || factor.content === "بند جديد...";
  const [content, setContent] = useState(isInitialEmpty ? "" : factor.content);
  const [isEditing, setIsEditing] = useState(isInitialEmpty && !readOnly);
  const [justSaved, setJustSaved] = useState(false);
  const [showResuggestPrompt, setShowResuggestPrompt] = useState(false);
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isTrend = factor.field === "trends";
  const isImplication = !isTrend;
  const hasParent = Boolean(factor.parentFactorId);

  useEffect(() => {
    const nextVal = factor.content === "بند جديد..." ? "" : (factor.content || "");
    setContent(nextVal);
  }, [factor.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 28)}px`;
    }
  }, [content, isEditing]);

  const startEditing = () => {
    if (readOnly) return;
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
    const cleanOriginal = factor.content === "بند جديد..." ? "" : (factor.content || "").trim();
    if (cleanCurrent !== cleanOriginal) {
      onUpdate(cleanCurrent, factor.parentFactorId);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);

      // If trend was updated, offer AI resuggestion of implications
      if (isTrend && onResuggestImplications) {
        setShowResuggestPrompt(true);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(factor.content === "بند جديد..." ? "" : (factor.content || ""));
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

  const handleScrollToParent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!factor.parentFactorId) return;
    const el = document.getElementById(`porter-factor-${factor.parentFactorId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-teal-400", "scale-[1.02]");
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-teal-400", "scale-[1.02]");
      }, 1500);
    }
  };

  const handleMouseEnter = () => {
    if (isTrend) {
      onHighlight?.(factor.id);
    } else if (factor.parentFactorId) {
      onHighlight?.(factor.parentFactorId);
    }
  };

  const handleMouseLeave = () => {
    onHighlight?.(null);
  };

  return (
    <div
      id={`porter-factor-${factor.id}`}
      draggable={!isEditing && !readOnly}
      onDragStart={!isEditing && !readOnly ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col p-3 rounded-xl transition-all duration-200 border ${
        isDragging
          ? "opacity-40 bg-teal-50/50 border-dashed border-teal-400 scale-[0.99]"
          : isEditing
          ? "bg-white border-teal-300 ring-2 ring-teal-500/20 shadow-xs"
          : isHighlighted
          ? isTrend
            ? "bg-teal-50/70 border-teal-400 ring-2 ring-teal-400/50 shadow-md scale-[1.01]"
            : factor.field === "positiveImpacts"
            ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md scale-[1.01]"
            : "bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/50 shadow-md scale-[1.01]"
          : "bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
      }`}
      dir="rtl"
    >
      <div className="flex items-start gap-2.5 w-full">
        {/* Drag handle & Move up/down (hidden in readOnly) */}
        {!readOnly && (
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
        )}

        {/* Number badge */}
        <div
          className={`w-6 h-6 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 pt-0.5 select-none transition-colors ${
            isEditing
              ? "bg-teal-50 border border-teal-200 text-teal-700"
              : isTrend
              ? "bg-teal-600 text-white font-extrabold shadow-xs"
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
            readOnly={readOnly}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => !readOnly && setIsEditing(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            dir="rtl"
            autoFocus={isInitialEmpty && !readOnly}
            className={`w-full text-xs sm:text-[13px] font-medium leading-relaxed resize-none focus:outline-none rounded-lg p-1 transition-all placeholder:text-slate-400 placeholder:font-normal ${
              readOnly
                ? "text-slate-800 bg-transparent cursor-default"
                : isEditing
                ? "text-slate-900 bg-white"
                : "text-slate-800 bg-transparent cursor-pointer hover:text-slate-900"
            }`}
            placeholder="بند جديد..."
          />

          {/* Implication Badge: Link to Parent Trend */}
          {isImplication && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {hasParent && parentIndex !== null ? (
                <button
                  type="button"
                  onClick={handleScrollToParent}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-teal-100 text-slate-600 hover:text-teal-800 border border-slate-200/90 transition-colors shadow-2xs group/btn"
                  title="انقر للانتقال إلى بند التوجه الأصلي"
                >
                  <LinkIcon className="w-2.5 h-2.5 text-slate-400 group-hover/btn:text-teal-600" />
                  <span>من البند {parentIndex}</span>
                  <ExternalLink className="w-2 h-2 opacity-60" />
                </button>
              ) : (
                !readOnly && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsLinkingOpen(!isLinkingOpen)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition-colors"
                      title="ربط هذا الانعكاس ببند توجه موجود"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      <span>غير مرتبط (ربط ببند)</span>
                    </button>

                    {isLinkingOpen && availableParentTrends.length > 0 && (
                      <div className="absolute top-full right-0 mt-1 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 flex flex-col gap-1 animate-fade-in">
                        <span className="text-[10px] font-bold text-slate-500 px-2 py-1">
                          اختر بند التوجه المرتبط:
                        </span>
                        {availableParentTrends.map((trend) => (
                          <button
                            key={trend.id}
                            type="button"
                            onClick={() => {
                              setIsLinkingOpen(false);
                              onUpdate(content, trend.id);
                            }}
                            className="text-right text-xs p-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-800 transition-colors truncate"
                          >
                            <span className="font-bold ml-1.5">[{trend.index}]</span>
                            <span>{trend.content}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
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

          {!readOnly && (
            <>
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
                    title={isTrend ? "حذف التوجه وانعكاسيه المرتبطين به" : "حذف هذا الانعكاس"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Missing Implication Alert for Trend (if child implication was deleted) */}
      {isTrend && missingImplications.length > 0 && !readOnly && (
        <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between gap-2 flex-wrap bg-amber-50/60 p-2 rounded-lg">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              ينقصه:{" "}
              {missingImplications.map((c, i) => (
                <span key={c}>
                  {c === "positiveImpacts" ? "انعكاس إيجابي (فرصة)" : "انعكاس سلبي (مخاطر)"}
                  {i < missingImplications.length - 1 ? " و " : ""}
                </span>
              ))}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {missingImplications.includes("positiveImpacts") && (
              <button
                type="button"
                onClick={() => onAddMissingImplication?.("positiveImpacts")}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
              >
                <PlusCircle className="w-2.5 h-2.5 text-emerald-600" />
                <span>+ إضافة فرصة</span>
              </button>
            )}
            {missingImplications.includes("negativeImpacts") && (
              <button
                type="button"
                onClick={() => onAddMissingImplication?.("negativeImpacts")}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-white hover:bg-rose-50 px-2 py-0.5 rounded border border-rose-200 transition-colors"
              >
                <PlusCircle className="w-2.5 h-2.5 text-rose-600" />
                <span>+ إضافة مخاطر</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resuggest prompt after editing trend text */}
      {showResuggestPrompt && isTrend && !readOnly && (
        <div className="mt-2.5 p-2 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-between gap-2 animate-fade-in">
          <span className="text-[11px] text-teal-800 font-medium">
            تم تعديل نص التوجه. هل ترغب في إعادة اقتراح الانعكاسين بالذكاء الاصطناعي؟
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowResuggestPrompt(false);
                onResuggestImplications?.();
              }}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>إعادة اقتراح</span>
            </button>
            <button
              type="button"
              onClick={() => setShowResuggestPrompt(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PorterFactorRow;
