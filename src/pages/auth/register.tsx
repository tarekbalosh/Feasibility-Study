import React, { useState, useCallback, useRef } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, UserPlus, CheckCircle2, MailCheck, XCircle, AlertCircle } from "lucide-react"
import { AuthLayout } from "@/layouts/AuthLayout"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { registerSchema, type RegisterFormData } from "@/lib/validations"
import { validateEmailApi } from "@/services/auth.service"

export default function RegisterPage() {
  const { register: registerUser, resendVerification } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  // ——— حالة التحقق الفوري من البريد الإلكتروني ———
  const [emailValidation, setEmailValidation] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    message: string;
  }>({ status: "idle", message: "" })
  const emailCheckTimer = useRef<NodeJS.Timeout | null>(null)
  const lastCheckedEmail = useRef<string>("")

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

  // ——— التحقق الفوري من البريد الإلكتروني عبر API ———
  const checkEmailValidity = useCallback(async (email: string) => {
    // Don't re-check the same email
    if (email === lastCheckedEmail.current) return

    // Basic format check before hitting API
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !basicEmailRegex.test(email)) {
      setEmailValidation({ status: "idle", message: "" })
      return
    }

    lastCheckedEmail.current = email
    setEmailValidation({ status: "checking", message: "جاري التحقق من البريد الإلكتروني..." })

    try {
      const result = await validateEmailApi(email)
      setEmailValidation({
        status: result.valid ? "valid" : "invalid",
        message: result.valid ? "✓ البريد الإلكتروني صالح" : result.message,
      })
    } catch {
      // On network error, don't block — server will validate on submit
      setEmailValidation({ status: "idle", message: "" })
    }
  }, [])

  const handleEmailBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim()
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current)
    // Small delay to avoid race conditions with form validation
    emailCheckTimer.current = setTimeout(() => checkEmailValidity(email), 300)
  }, [checkEmailValidity])

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null)

    // Block submission if email validation failed
    if (emailValidation.status === "invalid") {
      setApiError(emailValidation.message || "البريد الإلكتروني غير صالح.")
      return
    }

    // If email hasn't been validated yet, validate it first
    if (emailValidation.status === "idle" || emailValidation.status === "checking") {
      setEmailValidation({ status: "checking", message: "جاري التحقق من البريد الإلكتروني..." })
      const result = await validateEmailApi(data.email)
      setEmailValidation({
        status: result.valid ? "valid" : "invalid",
        message: result.valid ? "✓ البريد الإلكتروني صالح" : result.message,
      })
      if (!result.valid) {
        setApiError(result.message)
        return
      }
    }

    try {
      const returnTo = router.query.returnTo as string | undefined
      const res = await registerUser(data.fullName, data.email, data.password, returnTo)
      if (res && res.needsVerification) {
        setNeedsVerification(true)
      }
    } catch (err: any) {
      setApiError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
          "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى."
      )
    }
  }

  const router = useRouter()
  const returnTo = router.query.returnTo as string | undefined
  const loginHref = returnTo ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` : '/auth/login'

  return (
    <>
      <Head>
        <title>إنشاء حساب جديد — Feasibility Suite</title>
        <meta name="description" content="أنشئ حسابك المجاني وابدأ بإعداد دراسات الجدوى لمشاريعك باستخدام الذكاء الاصطناعي." />
      </Head>

      <AuthLayout
        title={needsVerification ? "تحقق من بريدك الإلكتروني" : "إنشاء حساب جديد"}
        subtitle={needsVerification ? "لقد أرسلنا رابط التوثيق إلى بريدك الإلكتروني" : "أنشئ حسابك المجاني لتبدأ بإعداد دراسات الجدوى"}
      >
        {needsVerification ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                <MailCheck className="w-10 h-10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-slate-600">
                أرسلنا رابطاً لتفعيل حسابك إلى:
              </p>
              <p className="font-semibold text-lg text-slate-800 dir-ltr inline-block">
                {watch("email")}
              </p>
              <p className="text-sm text-slate-500 mt-4">
                الرجاء النقر على الرابط في البريد الإلكتروني لتفعيل حسابك.
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <Button
                variant="outline"
                className="w-full py-3"
                disabled={isResending}
                onClick={async () => {
                  setIsResending(true)
                  setResendMessage("")
                  try {
                    // Since we do not save unverified users in DB, resend means registering again.
                    await registerUser(watch("fullName"), watch("email"), watch("password"))
                    setResendMessage("تم إرسال الرابط بنجاح! تفقد صندوق الوارد.")
                  } catch (err: any) {
                    setResendMessage("حدث خطأ أثناء إرسال الرابط. حاول مرة أخرى.")
                  } finally {
                    setIsResending(false)
                  }
                }}
              >
                {isResending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ الإرسال...
                  </span>
                ) : (
                  "لم يصلك البريد؟ أعد الإرسال"
                )}
              </Button>
              
              {resendMessage && (
                <p className="text-sm text-emerald-600 font-medium">
                  {resendMessage}
                </p>
              )}

              <div className="pt-4">
                <Link
                  href={loginHref}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
        ) : (
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
          <div>
            <Input
              id="register-email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="example@email.com"
              dir="ltr"
              className="text-left"
              error={errors.email?.message || (emailValidation.status === "invalid" ? emailValidation.message : undefined)}
              {...register("email", {
                onBlur: handleEmailBlur,
                onChange: () => {
                  // Reset validation when user changes the email
                  if (emailValidation.status !== "idle") {
                    setEmailValidation({ status: "idle", message: "" })
                    lastCheckedEmail.current = ""
                  }
                },
              })}
            />
            {/* مؤشر حالة التحقق من البريد */}
            {emailValidation.status === "checking" && (
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-xs text-indigo-500">{emailValidation.message}</span>
              </div>
            )}
            {emailValidation.status === "valid" && !errors.email && (
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600">{emailValidation.message}</span>
              </div>
            )}
            {emailValidation.status === "invalid" && !errors.email?.message && (
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-600">{emailValidation.message}</span>
              </div>
            )}
          </div>

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
              href={loginHref}
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
        )}
      </AuthLayout>
    </>
  )
}
