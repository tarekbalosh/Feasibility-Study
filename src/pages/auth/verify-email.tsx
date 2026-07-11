import React, { useEffect, useState, useRef } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Link from "next/link"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { verifyEmail } from "@/services/auth.service"
import { Button } from "@/components/ui/Button"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { token } = router.query
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("جاري التحقق من الرابط...")
  const called = useRef(false)

  useEffect(() => {
    if (!router.isReady) return
    if (called.current) return
    called.current = true

    if (!token || typeof token !== "string") {
      setStatus("error")
      setMessage("رابط التوثيق غير صالح أو مفقود.")
      return
    }

    const verify = async () => {
      try {
        const res = await verifyEmail(token)
        setStatus("success")
        setMessage(res.message || "تم توثيق حسابك بنجاح!")
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } catch (error: any) {
        setStatus("error")
        setMessage(
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "الرابط غير صالح أو منتهي الصلاحية."
        )
      }
    }

    verify()
  }, [router.isReady, token, router])

  return (
    <>
      <Head>
        <title>توثيق الحساب — Feasibility Suite</title>
      </Head>

      <AuthLayout
        title="توثيق الحساب"
        subtitle={
          status === "loading"
            ? "يرجى الانتظار بينما نقوم بالتحقق من رابط التوثيق الخاص بك..."
            : status === "success"
            ? "اكتمل التوثيق!"
            : "فشل التوثيق"
        }
      >
        <div className="text-center py-6 space-y-6">
          <div className="flex justify-center">
            {status === "loading" && (
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            )}
            {status === "error" && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          <p className={`text-lg font-medium ${
            status === "success" ? "text-emerald-600" : 
            status === "error" ? "text-red-600" : "text-slate-600"
          }`}>
            {message}
          </p>

          {status === "success" && (
            <p className="text-sm text-slate-500">
              سيتم تحويلك إلى صفحة تسجيل الدخول تلقائياً...
            </p>
          )}

          <div className="pt-6">
            {status === "error" ? (
              <Link href="/auth/register" passHref>
                <Button variant="primary" className="w-full">
                  العودة إلى صفحة التسجيل
                </Button>
              </Link>
            ) : status === "success" ? (
              <Link href="/auth/login" passHref>
                <Button variant="primary" className="w-full">
                  الانتقال لتسجيل الدخول
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </AuthLayout>
    </>
  )
}
