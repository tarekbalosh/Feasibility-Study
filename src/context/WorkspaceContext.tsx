import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useAuth } from "@/context/AuthContext"
import * as workspaceService from "@/services/workspace.service"
import type { Workspace } from "@/types/workspace"

interface WorkspaceState {
  /** مساحة العمل الحالية — أقدم عضوية فعّالة للمستخدم */
  workspace: Workspace | null
  /** كل المساحات التي ينتمي إليها (للتبديل بينها لاحقاً) */
  workspaces: Workspace[]
  /** هل ما زلنا نتحقّق؟ الحارس ينتظر انتهاء هذه الحالة قبل أي تحويل */
  isLoading: boolean
  /** هل يملك المستخدم مساحة عمل فعّالة؟ */
  hasWorkspace: boolean
}

interface WorkspaceContextType extends WorkspaceState {
  /** إعادة جلب الحالة من الخادم — تُستدعى بعد الإنشاء أو قبول دعوة */
  refresh: () => Promise<void>
  /** تحديث فوري بعد الإنشاء، فلا ينتظر المستخدم دورة شبكة أخرى */
  setWorkspace: (workspace: Workspace) => void
  /** الانتقال إلى مساحة عمل أخرى */
  switchWorkspace: (workspaceId: string) => Promise<void>
}

const initialState: WorkspaceState = {
  workspace: null,
  workspaces: [],
  isLoading: true,
  hasWorkspace: false,
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
)

/**
 * موفّر حالة مساحة العمل.
 *
 * يُحمَّل مرّة عند تسجيل الدخول ويُصفَّر عند الخروج. الحارس
 * (WorkspaceGuard) وزر البدء وترويسة المنصة يقرؤون منه جميعاً،
 * فلا يتكرّر الاستعلام عند كل تنقّل.
 */
export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth()
  const [state, setState] = useState<WorkspaceState>(initialState)

  const refresh = useCallback(async () => {
    // الزائر غير المسجَّل لا مساحة له — نُنهي التحميل دون نداء شبكة
    if (!isAuthenticated) {
      setState({ ...initialState, isLoading: false })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { workspaces, current, hasWorkspace } =
        await workspaceService.getMyWorkspaces()

      let active = current
      if (typeof window !== "undefined") {
        const savedId = localStorage.getItem("active_workspace_id")
        if (savedId) {
          const match = workspaces.find((w) => w.id === savedId)
          if (match) active = match
        } else if (active?.id) {
          localStorage.setItem("active_workspace_id", active.id)
        }
      }

      setState({
        workspace: active,
        workspaces,
        hasWorkspace,
        isLoading: false,
      })
    } catch {
      // فشل الجلب لا يجوز أن يُبقي الواجهة في دوران أبدي؛ نعتبره
      // «لا مساحة» ونترك الخادم يحسم الأمر عند أول نداء فعلي للأدوات.
      setState({ ...initialState, isLoading: false })
    }
  }, [isAuthenticated])

  // إعادة الجلب عند تغيّر هوية المستخدم (دخول، خروج، تبديل حساب).
  // المفتاح هو البريد لا المعرّف: استجابة تسجيل الدخول تُرجع userId
  // لا id، فحقل id غير موجود في الكائن المخزَّن.
  useEffect(() => {
    if (isAuthLoading) return
    void refresh()
  }, [isAuthLoading, refresh, user?.email])

  const setWorkspace = useCallback((workspace: Workspace) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("active_workspace_id", workspace.id)
    }
    setState((prev) => ({
      workspace,
      workspaces: prev.workspaces.some((w) => w.id === workspace.id)
        ? prev.workspaces.map((w) => (w.id === workspace.id ? workspace : w))
        : [...prev.workspaces, workspace],
      hasWorkspace: true,
      isLoading: false,
    }))
  }, [])

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("active_workspace_id", workspaceId)
      }
      setState((prev) => {
        const target = prev.workspaces.find((w) => w.id === workspaceId)
        return {
          ...prev,
          workspace: target || prev.workspace,
        }
      })
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/Overview"
      }
    },
    []
  )

  return (
    <WorkspaceContext.Provider value={{ ...state, refresh, setWorkspace, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}

export default WorkspaceContext
