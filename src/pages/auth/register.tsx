import React from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { AuthLayout } from "@/layouts/AuthLayout"
import { PasswordlessForm } from "@/components/auth/PasswordlessForm"

/**
 * بوّابة إنشاء مساحة العمل — بالبريد فقط، بلا كلمة مرور وبلا رمز تحقق.
 *
 * البريد وحده يدخلك فوراً إن كان لك حساب قائم؛ إن كان بريداً جديداً
 * تُطلب منك بعده اسم شركتك خطوة أخيرة قبل إنشاء الحساب. هذه الصفحة
 * نفسها هي "تسجيل الدخول" الوحيد على المنصة الآن — لا صفحة دخول منفصلة.
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

  const title = isJoiningWorkspace
    ? "انضم إلى مساحة العمل"
    : "أنشئ مساحة عملك الخاصة"

  const subtitle = isJoiningWorkspace
    ? "أدخل بريدك المدعو، وستدخل مباشرةً"
    : "أدخل بريدك الإلكتروني وستدخل مباشرةً — نطلب اسم شركتك فقط إن كان بريدك جديداً"

  return (
    <>
      <Head>
        <title>{title} — Feasibility Suite</title>
        <meta
          name="description"
          content="أنشئ مساحة عملك المجانية على Feasibility Suite بالبريد الإلكتروني فقط — بلا كلمة مرور، وابدأ بإعداد دراسات الجدوى وتحليلاتك الاستراتيجية."
        />
      </Head>

      <AuthLayout
        title={title}
        subtitle={subtitle}
        brandHeading={
          <>
            أنشئ مساحة عملك
            <br />
            الخاصة في دقائق
          </>
        }
        brandSubtitle="بيت واحد لأدواتك ودراساتك وفريقك — أنشئها بلا كلمة مرور، وابدأ استخدام أدوات دراسة الجدوى والتحليل فوراً."
      >
        <PasswordlessForm mode="login" redirectTo={safeReturnTo} />

        <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-center text-sm">
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
