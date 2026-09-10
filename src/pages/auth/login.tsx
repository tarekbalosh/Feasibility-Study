import { useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import { Loader2 } from "lucide-react"

/**
 * صفحة الدخول أُلغيت من المنصة: "أنشئ مساحة عملك الخاصة" أصبحت
 * الدخول الوحيد — بريد جديد يُنشئ حساباً، وبريد قائم يفتح جلسته
 * مباشرة. هذه الصفحة تبقى فقط لتحويل أي رابط قديم إلى الوجهة الجديدة.
 */
export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const returnToRaw = router.query.returnTo
    const returnTo = Array.isArray(returnToRaw) ? returnToRaw[0] : returnToRaw

    router.replace(
      returnTo ? `/auth/register?returnTo=${encodeURIComponent(returnTo)}` : "/auth/register"
    )
  }, [router, router.isReady])

  return (
    <>
      <Head>
        <title>جارٍ التحويل — Feasibility Suite</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    </>
  )
}
