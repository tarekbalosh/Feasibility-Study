import React, { useState, useEffect, useRef } from "react"
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
} from "lucide-react"
import type { PestFactor } from "@/types/pest"

interface PestFactorRowProps {
  factor: PestFactor
  index: number
  totalCount: number
  readOnly?: boolean
  isHighlighted?: boolean
  parentIndex?: number | null
  missingImplications?: ("positive_impact" | "negative_impact")[]
  availableParentTrends?: Array<{ id: string; content: string; index: number }>
  onUpdate: (content: string, parentFactorId?: string | null) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  isDragging?: boolean
  onHighlight?: (parentId: string | null) => void
  onAddMissingImplication?: (category: "positive_impact" | "negative_impact") => void
  onResuggestImplications?: () => void
}

export const PestFactorRow: React.FC<PestFactorRowProps> = ({
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
  const isInitialEmpty = !factor.content || factor.content === "بند جديد..."
  const [content, setContent] = useState(isInitialEmpty ? "" : factor.content)
  const [isEditing, setIsEditing] = useState(isInitialEmpty && !readOnly)
  const [justSaved, setJustSaved] = useState(false)
  const [showResuggestPrompt, setShowResuggestPrompt] = useState(false)
  const [isLinkingOpen, setIsLinkingOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isTrend = factor.category === "trend"
  const isImplication = !isTrend
  const hasParent = Boolean(factor.parentFactorId)

  useEffect(() => {
    const nextVal = factor.content === "بند جديد..." ? "" : (factor.content || "")
    setContent(nextVal)
  }, [factor.content])

  // ضبط الارتفاع التلقائي لسطر الإدخال
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 28)}px`
    }
  }, [content, isEditing])

  const startEditing = () => {
    if (readOnly) return
    setIsEditing(true)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const len = textareaRef.current.value.length
        textareaRef.current.setSelectionRange(len, len)
      }
    }, 50)
  }

  const handleSave = () => {
    setIsEditing(false)
    const cleanCurrent = content.trim()
    const cleanOriginal = factor.content === "بند جديد..." ? "" : (factor.content || "").trim()

    if (cleanCurrent !== cleanOriginal) {
      onUpdate(cleanCurrent)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)

      // إذا كان بند توجه وعُدّل نصه، نعرض خيار إعادة اقتراح الانعكاسين
      if (isTrend && onResuggestImplications) {
        setShowResuggestPrompt(true)
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setContent(factor.content === "بند جديد..." ? "" : (factor.content || ""))
  }

  const handleBlur = (e: React.FocusEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.closest(".factor-row-container")?.contains(related)) {
      return
    }
    handleSave()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  // التفاعل عند المرور
  const handleMouseEnter = () => {
    if (!onHighlight) return
    if (isTrend) {
      onHighlight(factor.id)
    } else if (factor.parentFactorId) {
      onHighlight(factor.parentFactorId)
    }
  }

  const handleMouseLeave = () => {
    if (onHighlight) onHighlight(null)
  }

  // النقر على شارة البند الأب للتمرير إليه وتمييزه
  const handleScrollToParent = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!factor.parentFactorId) return
    if (onHighlight) onHighlight(factor.parentFactorId)
    const targetEl = document.getElementById(`factor-${factor.parentFactorId}`)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
      targetEl.classList.add("ring-4", "ring-indigo-400")
      setTimeout(() => {
        targetEl.classList.remove("ring-4", "ring-indigo-400")
      }, 2000)
    }
  }

  return (
    <div
      id={`factor-${factor.id}`}
      draggable={!isEditing && !readOnly}
      onDragStart={!isEditing && !readOnly ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`factor-row-container group relative flex flex-col rounded-xl transition-all duration-300 border ${
        isDragging
          ? "opacity-40 bg-indigo-50/50 border-dashed border-indigo-400 scale-[0.99]"
          : isHighlighted
          ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/40 shadow-sm"
          : isEditing
          ? "bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
          : "bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
      }`}
      dir="rtl"
    >
      <div className="flex items-start gap-2.5 p-3">
        {/* مقبض السحب وأزرار التقديم والتأخير (مخفية في وضع القراءة) */}
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

        {/* شارة الترقيم الأنيقة */}
        <div
          className={`w-6 h-6 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 pt-0.5 select-none transition-colors ${
            isHighlighted
              ? "bg-indigo-600 text-white shadow-xs"
              : isEditing
              ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
              : "bg-slate-100/80 border border-slate-200/70 text-slate-600 shadow-2xs"
          }`}
        >
          {index + 1}
        </div>

        {/* حقل التحرير أو العرض */}
        <div className="flex-1 min-w-0" onClick={() => !readOnly && !isEditing && startEditing()}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            readOnly={readOnly || !isEditing}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => !readOnly && setIsEditing(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            dir="rtl"
            autoFocus={isInitialEmpty && !readOnly}
            className={`w-full text-xs sm:text-[13px] font-medium leading-relaxed resize-none focus:outline-none rounded-lg p-1 transition-all placeholder:text-slate-400 placeholder:font-normal ${
              isEditing
                ? "text-slate-900 bg-white"
                : readOnly
                ? "text-slate-800 bg-transparent cursor-default"
                : "text-slate-800 bg-transparent cursor-pointer hover:text-slate-900"
            }`}
            placeholder="بند جديد..."
          />

          {/* شارة الربط بالبند الأب إذا كان انعكاساً */}
          {isImplication && (
            <div className="flex items-center gap-2 mt-1">
              {hasParent && parentIndex !== null && parentIndex !== undefined ? (
                <button
                  type="button"
                  onClick={handleScrollToParent}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold transition-all shadow-2xs hover:scale-105"
                  title="اضغط للتمرير إلى البند الأصلي وتمييزه"
                >
                  <LinkIcon className="w-2.5 h-2.5 text-indigo-500" />
                  <span>من البند {parentIndex + 1}</span>
                  <ExternalLink className="w-2 h-2 opacity-60 mr-0.5" />
                </button>
              ) : (
                /* بند قديم بلا أب: يظهر بدون شارة مع إمكانية ربطه ببند من القائمة عند التعديل */
                !readOnly && (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsLinkingOpen((v) => !v)
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-0.5 rounded border border-dashed border-slate-200 transition"
                      title="ربط هذا الانعكاس بأحد بنود التوجهات في هذا البعد"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      <span>ربط ببند توجه...</span>
                    </button>

                    {isLinkingOpen && availableParentTrends.length > 0 && (
                      <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30">
                        <span className="text-[10px] font-bold text-slate-400 block px-2 py-1 border-b border-slate-100">
                          اختر البند الأب:
                        </span>
                        <div className="max-h-40 overflow-y-auto py-1">
                          {availableParentTrends.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsLinkingOpen(false)
                                onUpdate(content, t.id)
                              }}
                              className="w-full text-right px-2 py-1 text-xs hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded flex items-center gap-1.5 truncate"
                            >
                              <span className="font-bold text-[10px] text-indigo-600 shrink-0">
                                بند {t.index + 1}:
                              </span>
                              <span className="truncate">{t.content}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* شارات المصدر وأزرار الإجراءات */}
        <div className="shrink-0 flex items-center gap-1.5 pt-0.5 print:hidden">
          {justSaved && !isEditing && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[10px] text-emerald-600 border border-emerald-200 font-bold animate-fade-in">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
              <span>حُفظ</span>
            </span>
          )}

          {factor.source === "ai" && !justSaved && !isEditing && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] text-white font-bold shadow-xs select-none"
              title="بند مقترح بالذكاء الاصطناعي"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-100" />
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

          {/* أزرار الحفظ والإلغاء أثناء التعديل النشط */}
          {!readOnly && isEditing ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSave()
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
                  e.preventDefault()
                  handleCancel()
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="إلغاء (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !readOnly ? (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={startEditing}
                className="opacity-80 sm:opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="تعديل هذا البند"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="opacity-80 sm:opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title={isTrend ? "حذف هذا البند وانعكاسيه المرتبطين" : "حذف هذا البند"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* تنبيه الانعكاسات الناقصة لبند التوجه (إن حُذف أحد انعكاسيه) */}
      {!readOnly && isTrend && missingImplications.length > 0 && (
        <div className="px-3 pb-2.5 pt-0.5 flex flex-wrap items-center gap-2 border-t border-amber-100 bg-amber-50/50 rounded-b-xl print:hidden">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>
              ينقصه:{" "}
              {missingImplications
                .map((m) => (m === "positive_impact" ? "انعكاس إيجابي (فرصة)" : "انعكاس سلبي (مخاطر)"))
                .join(" و ")}
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            {missingImplications.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onAddMissingImplication && onAddMissingImplication(cat)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border transition shadow-2xs ${
                  cat === "positive_impact"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                }`}
              >
                <PlusCircle className="w-2.5 h-2.5" />
                <span>إضافة {cat === "positive_impact" ? "إيجابي" : "سلبي"} سريعاً</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* خيار إعادة اقتراح الانعكاسين بعد تعديل نص التوجه */}
      {!readOnly && isTrend && showResuggestPrompt && (
        <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-indigo-100 bg-indigo-50/60 rounded-b-xl print:hidden animate-fade-in">
          <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>تم تعديل نص التوجه. هل ترغب في إعادة اقتراح انعكاسيه بالذكاء الاصطناعي؟</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowResuggestPrompt(false)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-white"
            >
              تجاهل
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResuggestPrompt(false)
                if (onResuggestImplications) onResuggestImplications()
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black shadow-2xs transition"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-200" />
              <span>إعادة اقتراح الانعكاسين</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PestFactorRow
