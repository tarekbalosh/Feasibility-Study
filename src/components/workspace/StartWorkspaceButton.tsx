import React, { useCallback } from "react"
import { useRouter } from "next/router"
import clsx from "clsx"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"

/** النص الافتراضي للزر — نص واحد عبر المنصة كلها */
export const START_WORKSPACE_LABEL = "أنشئ مساحة عملك الخاصة"

/** النص المعروض لمن يملك مساحة عمل بالفعل */
export const OPEN_WORKSPACE_LABEL = "انتقل إلى لوحة التحكم"

interface StartWorkspaceButtonProps {
  className?: string
  children?: React.ReactNode
  /** أيقونة تُعرض بعد النص (سهم مثلاً) */
  icon?: React.ReactNode
  /** استدعاء بعد النقر — لإغلاق قائمة الجوال مثلاً */
  onNavigate?: () => void
  /** إبقاء النص ثابتاً حتى لمن يملك مساحة (لبطاقات التسويق) */
  fixedLabel?: boolean
}

/**
 * زر البدء الموحّد — نقطة الدخول الإجبارية إلى المنصة.
 *
 * الوجهة تُحسب لحظة النقر لا وقت التصيير، فلا يُصيَّر رابط خاطئ على
 * الخادم ثم يُصحَّح بعد الترطيب:
 *   • زائر            → /auth/register (ثم يعود إلى إنشاء المساحة)
 *   • مسجَّل بلا مساحة → /workspace/create
 *   • مسجَّل له مساحة  → /dashboard
 */
export const StartWorkspaceButton: React.FC<StartWorkspaceButtonProps> = ({
  className,
  children,
  icon,
  onNavigate,
  fixedLabel = false,
}) => {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { hasWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()

  const handleClick = useCallback(() => {
    onNavigate?.()

    if (!isAuthenticated) {
      // إنشاء المساحة هو الوجهة بعد التسجيل، لا لوحة التحكم
      router.push(
        `/auth/register?returnTo=${encodeURIComponent("/workspace/create")}`
      )
      return
    }

    // ما زال الفحص جارياً: نرسله إلى صفحة الإنشاء، وهي نفسها تحوّل
    // من يملك مساحة إلى لوحة التحكم — فلا يعلق المستخدم في انتظار.
    if (isWorkspaceLoading || !hasWorkspace) {
      router.push("/workspace/create")
      return
    }

    router.push("/dashboard")
  }, [
    router,
    isAuthenticated,
    isWorkspaceLoading,
    hasWorkspace,
    onNavigate,
  ])

  // قبل انتهاء فحص الجلسة نعرض النص الافتراضي: هو الصحيح للزائر،
  // وهو أغلب من يرى هذا الزر.
  const showOpenLabel =
    !fixedLabel && !isAuthLoading && isAuthenticated && hasWorkspace

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx("inline-flex items-center justify-center gap-2", className)}
    >
      {children ?? (showOpenLabel ? OPEN_WORKSPACE_LABEL : START_WORKSPACE_LABEL)}
      {icon}
    </button>
  )
}

export default StartWorkspaceButton
