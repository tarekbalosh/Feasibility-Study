import React, { useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Loader2, ShieldAlert } from "lucide-react"
import { WorkspaceGuard } from "@/components/workspace/WorkspaceGuard"
import { useWorkspace } from "@/context/WorkspaceContext"
import { getToolComponent } from "@/config/tools.components"
import { getToolBySlug, getToolPath, canRoleAccessTool } from "@/config/tools.registry"
import { ROLE_LABELS } from "@/types/workspace"

/** شاشة انتظار موحّدة أثناء تحديد الأداة أو التحويل */
const Waiting: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="min-h-screen flex items-center justify-center bg-slate-50"
    dir="rtl"
  >
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  </div>
)

/**
 * مشغّل الأدوات — /tools/<slug>/start
 * يقرأ الأداة من السجلّ ويحمّل مكوّنها من خريطة المكوّنات، فإضافة
 * أداة جديدة لا تتطلب صفحةً جديدة هنا. الأدوات التي لم يُربط لها
 * مكوّن بعد تُحوَّل إلى صفحة تعريفها.
 *
 * كل ما تحت هذا المسار محروس بـ WorkspaceGuard، ويتم فحص صلاحية
 * دور المستخدم داخل مساحة العمل لمنع الوصول غير المصرح به (403).
 */
export default function ToolStartPage() {
  const router = useRouter()
  const { slug } = router.query
  const { workspace, isLoading: isWorkspaceLoading } = useWorkspace()

  const tool = getToolBySlug(slug)
  const ToolComponent = tool ? getToolComponent(tool.slug) : undefined

  useEffect(() => {
    // ننتظر ترطيب المسار قبل أي تحويل (slug يكون undefined أولاً)
    if (!router.isReady) return

    if (!tool) {
      router.replace("/tools")
      return
    }

    if (!ToolComponent) {
      // الأداة معرّفة لكن لم يُربط لها مكوّن — صفحة التعريف تشرح حالتها
      router.replace(getToolPath(tool.slug))
    }
  }, [router, router.isReady, tool, ToolComponent])

  if (!router.isReady) {
    return <Waiting message="جارٍ تحميل الأداة..." />
  }

  if (!tool || !ToolComponent) {
    return <Waiting message="جارٍ تحويلك..." />
  }

  // فحص الصلاحية لدور المستخدم الحالي — شاشة 403 Forbidden
  if (tool && workspace && !isWorkspaceLoading && !canRoleAccessTool(tool, workspace.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" dir="rtl">
        <Head>
          <title>403 غير مصرح بالوصول | Feasibility Suite</title>
        </Head>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">403 - غير مصرح بالوصول</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            دورك الحالي (<span className="font-semibold text-slate-800">{ROLE_LABELS[workspace.role] || workspace.role}</span>) في مساحة العمل لا يملك صلاحية الوصول إلى أداة «{tool.name}».
          </p>
          <Link
            href="/dashboard/Overview"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    )
  }

  const content = (
    <>
      <Head>
        {/* شاشات الأدوات نفسها لا تُفهرس — الصفحة المفهرسة هي صفحة التعريف */}
        <meta name="robots" content="noindex" />
      </Head>
      <ToolComponent />
    </>
  )

  return <WorkspaceGuard>{content}</WorkspaceGuard>
}

