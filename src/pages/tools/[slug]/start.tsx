import React, { useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import { Loader2 } from "lucide-react"
import { WorkspaceGuard } from "@/components/workspace/WorkspaceGuard"
import { getToolComponent } from "@/config/tools.components"
import { getToolBySlug, getToolPath } from "@/config/tools.registry"

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
 * كل ما تحت هذا المسار محروس بـ WorkspaceGuard، فأي أداة تُضاف
 * لاحقاً ترث الحماية دون تعديل.
 */
export default function ToolStartPage() {
  const router = useRouter()
  const { slug } = router.query

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

  const content = (
    <>
      <Head>
        {/* شاشات الأدوات نفسها لا تُفهرس — الصفحة المفهرسة هي صفحة التعريف */}
        <meta name="robots" content="noindex" />
      </Head>
      <ToolComponent />
    </>
  )

  // كل الأدوات خلف حارس مساحة العمل — لا استثناء لأداة «بلا تسجيل»:
  // الحارس يتكفّل بسلسلة تسجيل الدخول ثم إنشاء المساحة، وحقل
  // requiresAuth في السجلّ لم يعد يميّز أداةً عن أخرى بعد أن صار
  // إنشاء المساحة إجبارياً للجميع.
  return <WorkspaceGuard>{content}</WorkspaceGuard>
}
