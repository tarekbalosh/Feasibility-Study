import React, { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { registerSchema, type RegisterFormData } from "@/lib/validations"

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password", "")

  // مؤشرات قوة كلمة المرور
  const passwordChecks = [
    { label: "8 أحرف على الأقل", valid: password.length >= 8 },
    { label: "حرف كبير واحد", valid: /[A-Z]/.test(password) },
    { label: "رقم واحد", valid: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null)
    try {
      await registerUser(data.fullName, data.email, data.password)
    } catch (err: any) {
      setApiError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
          "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى."
      )
    }
  }

  return (
    <>
      <Head>
        <title>إنشاء حساب جديد — Feasibility Suite</title>
        <meta name="description" content="أنشئ حسابك المجاني وابدأ بإعداد دراسات الجدوى لمشاريعك باستخدام الذكاء الاصطناعي." />
      </Head>

      <AuthLayout
        title="إنشاء حساب جديد"
        subtitle="أنشئ حسابك المجاني لتبدأ بإعداد دراسات الجدوى"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* رسالة الخطأ من الـ API */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* الاسم الكامل */}
          <Input
            id="register-fullName"
            label="الاسم الكامل"
            placeholder="مثال: أحمد محمد العلي"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          {/* البريد الإلكتروني */}
          <Input
            id="register-email"
            type="email"
            label="البريد الإلكتروني"
            placeholder="example@email.com"
            dir="ltr"
            className="text-left"
            error={errors.email?.message}
            {...register("email")}
          />

          {/* كلمة المرور */}
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              label="كلمة المرور"
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
              id="register-confirmPassword"
              type={showConfirm ? "text" : "password"}
              label="تأكيد كلمة المرور"
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

          {/* زر التسجيل */}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full py-3 text-base font-semibold"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ إنشاء الحساب...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                إنشاء الحساب
              </span>
            )}
          </Button>

          {/* رابط تسجيل الدخول */}
          <p className="text-center text-sm text-slate-500 mt-4">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              تسجيل الدخول
            </Link>
          </p>

          {/* سياسة الخصوصية */}
          <p className="text-center text-xs text-slate-400 leading-relaxed mt-2">
            بإنشاء حسابك فإنك توافق على{" "}
            <Link href="/terms" className="underline hover:text-slate-600">
              شروط الخدمة
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="underline hover:text-slate-600">
              سياسة الخصوصية
            </Link>
          </p>
        </form>
      </AuthLayout>
    </>
  )
}
