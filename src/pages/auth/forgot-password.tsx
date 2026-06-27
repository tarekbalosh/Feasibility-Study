import React, { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Send, ArrowRight, MailCheck } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations"

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null)
    try {
      await forgotPassword(data.email)
      setSentEmail(data.email)
      setIsSuccess(true)
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
          "حدث خطأ أثناء إرسال رابط الاسترداد. يرجى المحاولة لاحقاً."
      )
    }
  }

  return (
    <>
      <Head>
        <title>نسيت كلمة المرور — Feasibility Suite</title>
        <meta name="description" content="أدخل بريدك الإلكتروني لاسترداد كلمة المرور الخاصة بحسابك على Feasibility Suite." />
      </Head>

      <AuthLayout
        title={isSuccess ? "تم الإرسال بنجاح" : "نسيت كلمة المرور؟"}
        subtitle={
          isSuccess
            ? undefined
            : "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور"
        }
      >
        {isSuccess ? (
          /* حالة النجاح */
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <MailCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-700 text-sm leading-relaxed">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى:
              </p>
              <p className="text-indigo-600 font-semibold text-base" dir="ltr">
                {sentEmail}
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              إذا لم يصلك البريد خلال دقائق، تحقق من مجلد الرسائل غير المرغوبة (Spam). صلاحية الرابط 60 دقيقة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 border border-slate-200"
                onClick={() => {
                  setIsSuccess(false)
                  setSentEmail("")
                }}
              >
                إعادة الإرسال
              </Button>
              <Link href="/auth/login" className="flex-1">
                <Button variant="primary" className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    العودة لتسجيل الدخول
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* نموذج الإدخال */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{apiError}</span>
              </div>
            )}

            <Input
              id="forgot-email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="example@email.com"
              dir="ltr"
              className="text-left"
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3 text-base font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ الإرسال...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  إرسال رابط الاسترداد
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500 mt-4">
              تذكّرت كلمة المرور؟{" "}
              <Link
                href="/auth/login"
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              >
                تسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </AuthLayout>
    </>
  )
}
