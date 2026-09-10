import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Loader2, Send, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { EmailChipsInput } from "@/components/workspace/EmailChipsInput"
import * as workspaceService from "@/services/workspace.service"
import type { WorkspaceInviteDraft } from "@/types/workspace"

interface InviteTeamModalProps {
  workspaceId: string
  workspaceName: string
  isOpen: boolean
  onClose: () => void
}

/** استخراج رسالة الخطأ العربية من استجابة الخادم */
const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  fallback

/**
 * نافذة دعوة أعضاء إلى مساحة عمل قائمة — تُفتح من أي مكان في المنصة
 * (ترويسة الموقع مثلاً)، لا من شاشة الإنشاء فقط. تعيد استخدام نفس
 * حقل الدعوات (EmailChipsInput) ونقطة نهاية الدعوة المستقلة
 * (workspaceService.inviteMembers) بدل تكرارهما.
 */
export const InviteTeamModal: React.FC<InviteTeamModalProps> = ({
  workspaceId,
  workspaceName,
  isOpen,
  onClose,
}) => {
  const [invites, setInvites] = useState<WorkspaceInviteDraft[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // نركّب النافذة على document.body مباشرة (لا في مكانها داخل الشجرة)
  // لأن الزر الذي يفتحها يعيش عادةً داخل ترويسة فيها backdrop-blur —
  // وأي خاصية filter/backdrop-filter/transform على سلف تصنع "containing
  // block" جديداً لعناصر position:fixed، فتنحصر النافذة داخل حدود تلك
  // الترويسة الصغيرة بدل تغطية الشاشة كاملة. البوابة تتجاوز هذه المشكلة
  // كلياً. mounted تمنع محاولة الوصول لـ document أثناء التصيير على
  // الخادم (SSR) في Next.js.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!isOpen || !mounted) return null

  const handleClose = () => {
    if (isSubmitting) return
    setInvites([])
    onClose()
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) handleClose()
  }

  const submit = async () => {
    if (invites.length === 0) return
    setIsSubmitting(true)

    try {
      const result = await workspaceService.inviteMembers(workspaceId, invites)
      toast.success(
        result.invitesSent === result.invitesCreated
          ? `تم إرسال ${result.invitesCreated} دعوة إلى فريقك.`
          : `أُنشئت ${result.invitesCreated} دعوة، وأُرسل منها ${result.invitesSent}. يمكنك إعادة الإرسال لاحقاً.`
      )
      setInvites([])
      onClose()
    } catch (err: any) {
      toast.error(errorMessage(err, "تعذّر إرسال الدعوات. حاول مرة أخرى."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      {/* min-h-full + py تمنع قصّ أعلى النافذة (وزر الإغلاق فيه) عند
          قصر ارتفاع الشاشة — بدل التمركز الثابت الذي كان يدفع الزائد
          خارج حدود الرؤية بلا أي وسيلة للتمرير إليه */}
      <div className="flex min-h-full items-center justify-center p-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 p-6 pb-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ادعُ فريق العمل الخاص بك
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                ادعُ زملاءك إلى مساحة «{workspaceName}» بالبريد الإلكتروني وحدّد
                دور كل واحد منهم، وستصلهم روابط الانضمام فوراً.
              </p>
            </div>

            {/* زر إغلاق واضح داخل النافذة — يبقى دوماً ضمن حدودها
                فلا يُقصّ إن قصُر ارتفاع الشاشة */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="إغلاق"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition-all hover:scale-105 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </button>
          </div>

          <div className="p-6 pt-4">
            <div className="mt-5">
              <EmailChipsInput
                invites={invites}
                onChange={setInvites}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="button"
              disabled={invites.length === 0 || isSubmitting}
              onClick={submit}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {invites.length > 0
                    ? `إرسال الدعوات (${invites.length})`
                    : "إرسال الدعوات"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default InviteTeamModal
