import React from "react"
import clsx from "clsx"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

/**
 * ─────────────────────────────────────────────────────────────
 *  نافذة تأكيد — للإجراءات التي لا رجعة فيها
 * ─────────────────────────────────────────────────────────────
 *  لا حذف بنقرة واحدة في المنصة: كل إجراء مدمِّر يمرّ من هنا،
 *  وتعرض النافذة اسم ما سيُحذف نصاً حتى يقرأه المستخدم قبل التأكيد.
 * ─────────────────────────────────────────────────────────────
 */

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** نص الرسالة — يُفترض أن يذكر اسم العنصر المستهدف */
  message: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** destructive يصبغ زر التأكيد بالأحمر */
  tone?: "destructive" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "إلغاء",
  tone = "destructive",
  onConfirm,
  onCancel,
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  // Escape يُغلق، والتركيز يبدأ على «إلغاء» لا على زر الحذف
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKeyDown)
    cancelRef.current?.focus()
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-start gap-3 p-5">
          <span
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              tone === "destructive"
                ? "bg-red-50 text-red-600"
                : "bg-slate-100 text-slate-600"
            )}
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-base font-bold text-slate-900"
            >
              {title}
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed">
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          {/* زر أصلي لا Button: نحتاج ref لنقل التركيز إليه عند الفتح */}
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className={clsx(
              "w-full sm:w-auto min-h-[44px] px-5 py-2 text-sm",
              tone === "destructive" &&
                "bg-red-600 hover:bg-red-700 focus:ring-red-500"
            )}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
