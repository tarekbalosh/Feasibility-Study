import React from "react"
import clsx from "clsx"
import { useRouter } from "next/router"
import {
  ArrowLeft,
  Calculator,
  Check,
  Compass,
  Copy,
  MoreHorizontal,
  Pencil,
  Printer,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import {
  HORIZON_LABELS,
  PrioritiesShortfallNote,
  QUADRANTS,
  ReportDisclaimer,
  ReportMetaBox,
  STRATEGY_GROUPS,
  horizonBadgeClass,
  prioritySourceLabel,
  sourceLabel,
  toPlainText,
} from "./reportMeta"
import { handOffToFeasibility } from "@/utils/feasibilityHandoff"
import { getToolStartPath } from "@/config/tools.registry"
import { MAX_PRIORITIES, type SwotAnalysis, type SwotInput, type SwotQuadrantKey } from "@/types/swot"
import { SwotStrategiesSection } from "../strategies/SwotStrategiesSection"

/**
 * ─────────────────────────────────────────────────────────────
 *  تقرير SWOT — نسخة الشاشة
 * ─────────────────────────────────────────────────────────────
 *  هنا وحدها أدوات التحكم والتعديل. نسخة التصدير مكوّن مستقل
 *  (SwotReportDocument) يقرأ نفس البيانات ولا يحمل أي عنصر تفاعلي.
 *  هذا المكوّن كله print:hidden — لا يدخل الملف المصدَّر إطلاقاً.
 * ─────────────────────────────────────────────────────────────
 */

const ar = (value: number): string => value.toLocaleString("ar-EG")

interface SwotReportViewProps {
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

export const SwotReportView: React.FC<SwotReportViewProps> = ({
  input,
  analysis,
  onEditInput,
  onEditSelection,
  onRegenerate,
  onReset,
  removeItem,
  editItem,
}) => {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // تعديل بند بعد التوليد — بند واحد فقط قابل للتحرير في آنٍ عبر التقرير كله
  const [editing, setEditing] = React.useState<
    { quadrant: SwotQuadrantKey; index: number } | null
  >(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDetail, setEditDetail] = React.useState("")

  const startEditItem = (
    quadrant: SwotQuadrantKey,
    index: number,
    title: string,
    detail?: string
  ) => {
    setEditing({ quadrant, index })
    setEditTitle(title)
    setEditDetail(detail ?? "")
  }

  const cancelEditItem = () => setEditing(null)

  const submitEditItem = () => {
    if (!editing) return
    const title = editTitle.trim()
    if (!title) return
    editItem(editing.quadrant, editing.index, {
      title,
      detail: editDetail.trim() || undefined,
    })
    setEditing(null)
  }

  // إغلاق قائمة ⋯ بالنقر خارجها أو بمفتاح Escape
  React.useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(input, analysis))
      toast.success("تم نسخ التحليل إلى الحافظة")
    } catch {
      toast.error("تعذّر النسخ — يمكنك طباعة التحليل بدلاً من ذلك")
    }
  }

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(analysis.id)
      toast.success(`تم نسخ معرّف التقرير ${analysis.id}`)
    } catch {
      toast.error("تعذّر نسخ المعرّف")
    }
  }

  /** يملأ مسودة أداة دراسة الجدوى ثم يفتحها — المعرّف وحده في الرابط */
  const handleOpenFeasibility = () => {
    const handoffId = handOffToFeasibility(analysis.id, input)
    const path = getToolStartPath("feasibility-study")
    router.push(handoffId ? `${path}?from=${handoffId}` : path)
  }

  /**
   * التقارير المحفوظة قبل إضافة الخاتمة لا تحمل أولويات، وقد يصل تقرير
   * ناقص من أي مصدر آخر. التقرير يُعرض ناقصاً ولا ينهار.
   */
  const priorities = analysis.priorities ?? []

  return (
    <div className="flex flex-col gap-8 print:hidden" dir="rtl">
      {/* ── ترويسة التقرير وأدواته ─────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-900">
              تحليل SWOT — {input.projectName}
            </h2>
            <Badge variant="default">{input.sector}</Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            {analysis.source === "ai" ? (
              <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
            ) : (
              <Compass className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            {sourceLabel(analysis)} — لتغيير البنود ارجع إلى «تعديل الاختيارات».
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onEditInput}
            className="border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm gap-1.5"
          >
            <Pencil className="w-4 h-4" />
            تعديل المدخلات
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onEditSelection}
            className="border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm gap-1.5"
          >
            <Check className="w-4 h-4" />
            تعديل الاختيارات
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onRegenerate}
            className="border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة التوليد
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => window.print()}
            className="px-4 py-2 text-sm gap-1.5 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
          >
            <Printer className="w-4 h-4" />
            طباعة / PDF
          </Button>

          {/* قائمة ⋯ — موضع الإجراءات النادرة والمدمِّرة */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="إجراءات أخرى"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-150"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute left-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    handleCopy()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-right text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                  نسخ التحليل نصّاً
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmDelete(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-right text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف التحليل
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── الملخص التنفيذي ────────────────────────────────── */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-900 via-slate-900 to-slate-950 opacity-90" />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            الملخص التنفيذي
          </span>
          <p className="text-sm sm:text-base leading-relaxed text-slate-200">
            {analysis.summary}
          </p>
        </div>
      </div>

      {/* ── المصفوفة الرباعية ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {QUADRANTS.map((quadrant) => {
          const Icon = quadrant.icon
          const items = analysis[quadrant.key] ?? []
          const userCount = items.filter((item) => item.source === "user").length
          // الوسم على كل بند لا يفيد إلا إذا اختلط المصدران داخل الربع
          const isMixed = userCount > 0 && userCount < items.length

          return (
            <div
              key={quadrant.key}
              className={clsx(
                "bg-white border-2 rounded-2xl overflow-hidden flex flex-col",
                quadrant.ring
              )}
            >
              <div
                className={clsx(
                  "flex items-center gap-3 px-5 py-4",
                  quadrant.header
                )}
              >
                <span
                  className={clsx(
                    "w-9 h-9 rounded-lg text-white font-black flex items-center justify-center shrink-0",
                    quadrant.chip
                  )}
                >
                  {quadrant.letter}
                </span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span className="text-base font-bold">{quadrant.title}</span>
                  <span className="text-xs opacity-80">{quadrant.subtitle}</span>
                </span>
                {userCount > 0 && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold">
                    <Check className="w-3 h-3" strokeWidth={3} />
                    {ar(userCount)} من اختيارك
                  </span>
                )}
                <Icon className="w-5 h-5 shrink-0 opacity-70" />
              </div>

              <ul className="flex flex-col gap-2 p-4 flex-1">
                {items.map((item, index) => {
                  const isEditing =
                    editing?.quadrant === quadrant.key && editing.index === index

                  if (isEditing) {
                    return (
                      <li
                        key={index}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault()
                              cancelEditItem()
                            }
                          }}
                          placeholder="عنوان البند"
                          aria-label="تعديل عنوان البند"
                          className="w-full min-h-[38px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                        />
                        <textarea
                          value={editDetail}
                          onChange={(e) => setEditDetail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault()
                              cancelEditItem()
                            }
                          }}
                          placeholder="شرح البند (اختياري)"
                          aria-label="تعديل شرح البند"
                          rows={2}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={cancelEditItem}
                            className="px-3 py-1.5 text-xs border border-slate-200 bg-white hover:bg-slate-50"
                          >
                            إلغاء
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={submitEditItem}
                            disabled={!editTitle.trim()}
                            className="px-3 py-1.5 text-xs gap-1.5 bg-slate-900 hover:bg-slate-700 focus:ring-slate-500"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            حفظ
                          </Button>
                        </div>
                      </li>
                    )
                  }

                  return (
                    <li key={index} className="flex items-start gap-2 group">
                      <span
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full shrink-0 mt-2.5",
                          quadrant.dot
                        )}
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-sm text-slate-800 font-medium leading-relaxed px-2 py-1">
                          {item.title}
                        </p>
                        {item.detail && (
                          <p className="text-xs text-slate-500 leading-relaxed px-2 pb-1">
                            {item.detail}
                          </p>
                        )}
                        {isMixed && (
                          <span
                            className={clsx(
                              "self-start mx-2 mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              item.source === "user"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {item.source === "user" ? (
                              <>
                                <Check className="w-3 h-3" strokeWidth={3} />
                                من اختيارك
                              </>
                            ) : (
                              "مقترح تلقائياً"
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          startEditItem(quadrant.key, index, item.title, item.detail)
                        }
                        aria-label={`تعديل البند «${item.title}»`}
                        className="shrink-0 mt-1 p-1.5 rounded-md text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(quadrant.key, index)}
                        aria-label={`حذف البند «${item.title}»`}
                        className="shrink-0 mt-1 p-1.5 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      {/* ── الاستراتيجيات بتبويباتها الجديدة ───────────── */}
      <SwotStrategiesSection analysis={analysis} />

      {/* ── أ) ابدأ من هنا — خلاصة التقرير كله ─────────────── */}
      <section className="rounded-2xl border-2 border-slate-900 bg-slate-900 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-white/10">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-400" />
            ابدأ من هنا — أولويات الـ ٩٠ يوماً
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ثلاثة إجراءات مشتقّة من استراتيجيات هذا التقرير، لا إضافات من خارجه.
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5">
          {priorities.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <PrioritiesShortfallNote count={0} />
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {priorities.map((priority, index) => {
                const source = prioritySourceLabel(
                  analysis,
                  priority.sourceStrategyId
                )
                return (
                  <li
                    key={index}
                    className="flex flex-col sm:flex-row items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-xl bg-slate-900 text-white text-sm font-black flex items-center justify-center">
                      {ar(index + 1)}
                    </span>

                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {priority.action}
                        </h4>
                        <span className={horizonBadgeClass(priority.horizon)}>
                          {HORIZON_LABELS[priority.horizon]}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-500">السبب: </span>
                        {priority.rationale}
                      </p>

                      <p className="text-xs text-slate-800 leading-relaxed rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <span className="font-bold text-slate-500">
                          مؤشر النجاح:{" "}
                        </span>
                        {priority.successMetric}
                      </p>

                      {source && (
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          مشتقّة من: {source}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          {priorities.length > 0 && priorities.length < MAX_PRIORITIES && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <PrioritiesShortfallNote count={priorities.length} />
            </div>
          )}
        </div>
      </section>

      {/* ── ب) الجسر إلى أداة دراسة الجدوى ─────────────────── */}
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-l from-indigo-50 to-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
          <Calculator className="w-6 h-6" />
        </span>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            تريد الأرقام؟ حوّل هذا التحليل إلى دراسة جدوى
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            قائمة الدخل والتدفقات النقدية ونقطة التعادل لمشروعك.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleOpenFeasibility}
          className="w-full sm:w-auto shrink-0 min-h-[48px] px-5 py-3 text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
        >
          ابدأ دراسة الجدوى
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </section>

      {/* ── ج) بيانات التقرير ──────────────────────────────── */}
      <ReportMetaBox
        input={input}
        analysis={analysis}
        idAction={
          <button
            type="button"
            onClick={handleCopyId}
            aria-label={`نسخ معرّف التقرير ${analysis.id}`}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors duration-150"
          >
            <Copy className="w-3 h-3" />
          </button>
        }
      />

      {/* ── د) إخلاء المسؤولية ─────────────────────────────── */}
      <ReportDisclaimer analysis={analysis} />

      {/* ── هـ) شريط الإجراءات — لا يعود المستخدم للأعلى ──── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="primary"
          onClick={() => window.print()}
          className="w-full sm:w-auto min-h-[48px] px-5 py-3 text-sm gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
        >
          <Printer className="w-4 h-4" />
          تصدير PDF
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleCopy}
          className="w-full sm:w-auto min-h-[48px] border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm gap-2"
        >
          <Copy className="w-4 h-4" />
          نسخ التحليل
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onEditSelection}
          className="w-full sm:w-auto min-h-[48px] border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm gap-2"
        >
          <Check className="w-4 h-4" />
          تعديل الاختيارات
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onRegenerate}
          className="w-full sm:w-auto min-h-[48px] border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة التوليد
        </Button>
      </div>

      {/* حذف التحليل — لا يقع إلا بعد قراءة اسمه في نافذة التأكيد */}
      <ConfirmDialog
        open={confirmDelete}
        title="حذف التحليل"
        message={
          <>
            سيُحذف تحليل «{input.projectName || "مشروعك"}» نهائياً، ولا يمكن
            التراجع عن ذلك. معرّف التقرير:{" "}
            <span className="font-mono font-bold">{analysis.id}</span>.
          </>
        }
        confirmLabel="حذف نهائياً"
        onConfirm={() => {
          setConfirmDelete(false)
          onReset()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

export default SwotReportView
