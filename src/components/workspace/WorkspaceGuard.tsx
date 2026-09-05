import React, { useEffect } from "react"
import { useRouter } from "next/router"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"

/** رسالة موحّدة — يعرضها الحارس والخادم بالنص نفسه */
export const WORKSPACE_REQUIRED_MESSAGE =
  "يجب إنشاء مساحة عمل أولاً لاستخدام الأدوات."

interface WorkspaceGuardProps {
  children: React.ReactNode
}

const Waiting: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="min-h-screen flex items-center justify-center bg-slate-50 font-cairo"
    dir="rtl"
  >
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  </div>
)

/**
 * حارس مسارات الأدوات (/tools/<slug>/start).
 *
 * سلسلة الشروط: تسجيل دخول ← مساحة عمل فعّالة ← الأداة.
 * كل تحويل يحمل returnTo فيعود المستخدم إلى الأداة التي قصدها بعد
 * إتمام الخطوة الناقصة، لا إلى الصفحة الرئيسية.
 *
 * هذا الحارس تجربة مستخدم لا حاجز أمني: التحقق الفعلي يجري في
 * الخادم عبر requireWorkspace على كل مسارات الأدوات.
 */
export const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({ children }) => {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { hasWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()

  useEffect(() => {
    if (isAuthLoading || !router.isReady) return

    const returnTo = encodeURIComponent(router.asPath)

    if (!isAuthenticated) {
      router.replace(`/auth/login?returnTo=${returnTo}`)
      return
    }

    // ننتظر انتهاء الفحص قبل الحكم، وإلا حوّلنا عضواً فعلياً لمجرد
    // أن الاستجابة لم تصل بعد.
    if (isWorkspaceLoading) return

    if (!hasWorkspace) {
      toast.error(WORKSPACE_REQUIRED_MESSAGE, { id: "workspace-required" })
      router.replace(`/workspace/create?returnTo=${returnTo}`)
    }
  }, [
    router,
    isAuthLoading,
    isAuthenticated,
    isWorkspaceLoading,
    hasWorkspace,
  ])

  if (isAuthLoading || !router.isReady) {
    return <Waiting message="جارٍ التحقق من حسابك..." />
  }

  if (!isAuthenticated) {
    return <Waiting message="جارٍ تحويلك لتسجيل الدخول..." />
  }

  if (isWorkspaceLoading) {
    return <Waiting message="جارٍ التحقق من مساحة عملك..." />
  }

  if (!hasWorkspace) {
    return <Waiting message="جارٍ تحويلك لإنشاء مساحة عمل..." />
  }

  return <>{children}</>
}

export default WorkspaceGuard
