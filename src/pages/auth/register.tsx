import React from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { AuthLayout } from "@/layouts/AuthLayout"
import { PasswordlessForm } from "@/components/auth/PasswordlessForm"

/**
 * بوّابة إنشاء مساحة العمل — بالبريد فقط، بلا كلمة مرور.
 *
 * الاسم والبريد ثم رمز من 6 أرقام: الحساب يُنشأ عند أول تحقّق ناجح،
 * فلا خطوة توثيق بريد منفصلة بعدها. من كان له حساب قديم بكلمة مرور
 * يجد الرابط الاحتياطي أسفل الصفحة.
 */
export default function RegisterPage() {
  const router = useRouter()

  const returnToRaw = router.query.returnTo
  const returnTo = Array.isArray(returnToRaw) ? returnToRaw[0] : returnToRaw

  // مسارات داخلية فقط — قيمة خارجية تصبح تحويلاً مفتوحاً
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : undefined

  const isJoiningWorkspace = Boolean(safeReturnTo?.startsWith("/invite/accept"))

  const loginHref = safeReturnTo
    ? `/auth/login?returnTo=${encodeURIComponent(safeReturnTo)}`
    : "/auth/login"

  const title = isJoiningWorkspace
    ? "انضم إلى مساحة العمل"
    : "أنشئ مساحة عملك الخاصة"

  const subtitle = isJoiningWorkspace
    ? "أدخل اسمك وبريدك المدعو، وسنرسل لك رمز الدخول"
    : "أدخل اسمك وبريدك الإلكتروني — ونرسل لك رمز الدخول فوراً"

  return (
    <>
      <Head>
        <title>{title} — Feasibility Suite</title>
        <meta
          name="description"
          content="أنشئ مساحة عملك المجانية على Feasibility Suite بالبريد الإلكتروني فقط — بلا كلمة مرور، وابدأ بإعداد دراسات الجدوى وتحليلاتك الاستراتيجية."
        />
      </Head>

      <AuthLayout title={title} subtitle={subtitle}>
        <PasswordlessForm mode="signup" redirectTo={safeReturnTo} />

        <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-center text-sm">
          <p className="text-slate-500">
            لديك حساب بالفعل؟{" "}
            <Link
              href={loginHref}
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              تسجيل الدخول
            </Link>
          </p>
          <p className="text-xs leading-relaxed text-slate-400">
            بمتابعتك فإنك توافق على{" "}
            <Link href="/terms" className="text-slate-500 underline hover:text-slate-700">
              شروط الخدمة
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-slate-500 underline hover:text-slate-700">
              سياسة الخصوصية
            </Link>
            .
          </p>
        </div>
      </AuthLayout>
    </>
  )
}
