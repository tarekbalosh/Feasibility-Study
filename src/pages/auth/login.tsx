import React, { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { PasswordlessForm } from "@/components/auth/PasswordlessForm"

export default function LoginPage() {
  const { login } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  // الدخول بالبريد هو الطريق الأساسي؛ كلمة المرور تُكشف عند الطلب
  const [usePassword, setUsePassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null)
    try {
      const returnTo = router.query.returnTo as string | undefined
      await login(data.email, data.password, data.rememberMe, returnTo)
    } catch (err: any) {
      const status = err.response?.status
      const serverMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message

      if (status === 400 || status === 401 || status === 404) {
        setApiError(serverMessage || "البريد الإلكتروني أو كلمة المرور غير صحيحة.")
      } else if (status === 429) {
        setApiError("تجاوزت الحد المسموح من المحاولات. يرجى الانتظار والمحاولة لاحقاً.")
      } else {
        setApiError(serverMessage || "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.")
      }
    }
  }

  const router = useRouter()
  const returnTo = router.query.returnTo as string | undefined
  const registerHref = returnTo ? `/auth/register?returnTo=${encodeURIComponent(returnTo)}` : '/auth/register'

  return (
    <>
      <Head>
        <title>تسجيل الدخول — Feasibility Suite</title>
        <meta name="description" content="سجّل دخولك إلى منصة Feasibility Suite لإدارة دراسات الجدوى الخاصة بمشاريعك." />
      </Head>

      <AuthLayout
        title="مرحباً بعودتك"
        subtitle={
          usePassword
            ? "سجّل دخولك بكلمة المرور للوصول إلى مساحة عملك"
            : "أدخل بريدك الإلكتروني وسنرسل لك رمز الدخول"
        }
      >
        {!usePassword ? (
          <>
            <PasswordlessForm mode="login" redirectTo={returnTo} />

            <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-center text-sm">
              <p className="text-slate-500">
                ليس لديك حساب؟{" "}
                <Link
                  href={registerHref}
                  className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  أنشئ مساحة عملك الخاصة
                </Link>
              </p>
              {/* مسار احتياطي للحسابات القديمة التي أُنشئت بكلمة مرور */}
              <button
                type="button"
                onClick={() => setUsePassword(true)}
                className="text-xs text-slate-400 underline transition-colors hover:text-slate-600"
              >
                لديك كلمة مرور؟ سجّل الدخول بها
              </button>
            </div>
          </>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* رسالة الخطأ */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* البريد الإلكتروني */}
          <Input
            id="login-email"
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
              id="login-password"
              type={showPassword ? "text" : "password"}
              label="كلمة المرور"
              placeholder="أدخل كلمة المرور"
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

          {/* Remember me + نسيت كلمة المرور */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                {...register("rememberMe")}
              />
              <span className="text-sm text-slate-600">تذكّرني</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* زر الدخول */}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full py-3 text-base font-semibold"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ تسجيل الدخول...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                تسجيل الدخول
              </span>
            )}
          </Button>

          <div className="mt-4 space-y-3 text-center text-sm">
            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              ← الرجوع للدخول بالبريد فقط
            </button>
            <p className="text-slate-500">
              ليس لديك حساب؟{" "}
              <Link
                href={registerHref}
                className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                أنشئ مساحة عملك الخاصة
              </Link>
            </p>
          </div>
        </form>
        )}
      </AuthLayout>
    </>
  )
}
