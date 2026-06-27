import React, { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { token } = router.query
  const { resetPassword } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password", "")

  const passwordChecks = [
    { label: "8 أحرف على الأقل", valid: password.length >= 8 },
    { label: "حرف كبير واحد", valid: /[A-Z]/.test(password) },
    { label: "رقم واحد", valid: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null)
    if (!token || typeof token !== "string") {
      setApiError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية.")
      return
    }
    try {
      await resetPassword(token, data.password)
      setIsSuccess(true)
    } catch (err: any) {
      const status = err.response?.status
      if (status === 400 || status === 410) {
        setApiError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.")
      } else {
        setApiError(
          err.response?.data?.message ||
            "حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى."
        )
      }
    }
  }

  return (
    <>
      <Head>
        <title>إعادة تعيين كلمة المرور — Feasibility Suite</title>
        <meta name="description" content="أدخل كلمة المرور الجديدة لإعادة تعيين الوصول إلى حسابك." />
      </Head>

      <AuthLayout
        title={isSuccess ? "تم التعيين بنجاح!" : "إعادة تعيين كلمة المرور"}
        subtitle={
          isSuccess
            ? undefined
            : "أدخل كلمة المرور الجديدة لحسابك"
        }
      >
        {isSuccess ? (
          /* حالة النجاح */
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-700 text-sm leading-relaxed max-w-sm">
              تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
            </p>
            <Link href="/auth/login" className="w-full mt-2">
              <Button variant="primary" className="w-full py-3 text-base font-semibold">
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  الانتقال لتسجيل الدخول
                </span>
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* رسالة الخطأ */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* كلمة المرور الجديدة */}
            <div className="relative">
              <Input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                label="كلمة المرور الجديدة"
                placeholder="أدخل كلمة مرور قوية"
                dir="ltr"
                className="text-left pl-12"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* مؤشر قوة كلمة المرور */}
            {password.length > 0 && (
              <div className="flex flex-col gap-1.5 px-1">
                {passwordChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        check.valid ? "text-emerald-500" : "text-slate-300"
                      }`}
                    />
                    <span className={check.valid ? "text-emerald-600" : "text-slate-400"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* تأكيد كلمة المرور */}
            <div className="relative">
              <Input
                id="reset-confirmPassword"
                type={showConfirm ? "text" : "password"}
                label="تأكيد كلمة المرور الجديدة"
                placeholder="أعد إدخال كلمة المرور"
                dir="ltr"
                className="text-left pl-12"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute left-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* زر الإرسال */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3 text-base font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ إعادة التعيين...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  تعيين كلمة المرور الجديدة
                </span>
              )}
            </Button>

            {/* رابط طلب رابط جديد */}
            <p className="text-center text-sm text-slate-500 mt-4">
              انتهت صلاحية الرابط؟{" "}
              <Link
                href="/auth/forgot-password"
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              >
                اطلب رابطاً جديداً
              </Link>
            </p>
          </form>
        )}
      </AuthLayout>
    </>
  )
}
