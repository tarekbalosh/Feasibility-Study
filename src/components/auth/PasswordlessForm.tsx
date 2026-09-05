import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { ArrowRight, Loader2, MailCheck, Send } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { OtpInput } from "@/components/auth/OtpInput"
import { useAuth } from "@/context/AuthContext"

/** مراحل الشاشة: إدخال البريد ← إدخال الرمز ← (اسم، للحسابات الجديدة) */
type Phase = "identify" | "code" | "name"

interface PasswordlessFormProps {
  /**
   * signup: شاشة إنشاء مساحة العمل — الاسم يُطلب مع البريد ابتداءً.
   * login:  شاشة الدخول — البريد وحده، والاسم لا يُطلب إلا إن تبيّن
   *         بعد التحقق أن البريد لا حساب له.
   */
  mode: "signup" | "login"
  /** الوجهة بعد نجاح الدخول — يمرَّر من returnTo */
  redirectTo?: string
}

/** استخراج رسالة الخطأ العربية من استجابة الخادم */
const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  fallback

/**
 * الدخول بالبريد فقط — بلا كلمة مرور.
 *
 * يرسل الخادم رمزاً من 6 أرقام صالحاً 10 دقائق، ويُنشئ الحساب تلقائياً
 * عند أول تحقّق ناجح. لا حاجة لتوثيق بريد منفصل: الرمز نفسه إثبات
 * ملكية الصندوق.
 */
export const PasswordlessForm: React.FC<PasswordlessFormProps> = ({
  mode,
  redirectTo,
}) => {
  const router = useRouter()
  const { requestLoginCode, verifyLoginCode } = useAuth()

  const [phase, setPhase] = useState<Phase>("identify")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [fieldError, setFieldError] = useState<{ name?: string; email?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const needsNameUpfront = mode === "signup"

  /** عدّاد تنازلي لزر «أعد الإرسال» — يطابق مهلة الخادم (60 ثانية) */
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const validateIdentity = useCallback((): boolean => {
    const errors: { name?: string; email?: string } = {}

    if (needsNameUpfront && name.trim().length < 2) {
      errors.name = "الاسم مطلوب (حرفان على الأقل)."
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errors.email = "أدخل بريداً إلكترونياً صحيحاً."
    }

    setFieldError(errors)
    return Object.keys(errors).length === 0
  }, [name, email, needsNameUpfront])

  // ── إرسال الرمز ───────────────────────────────────────────
  const sendCode = useCallback(
    async (isResend = false) => {
      if (!isResend && !validateIdentity()) return

      setApiError(null)
      setIsBusy(true)

      try {
        await requestLoginCode(
          email.trim(),
          needsNameUpfront ? name.trim() : undefined
        )
        setCode("")
        setPhase("code")
        setCooldown(60)
      } catch (err: any) {
        setApiError(errorMessage(err, "تعذّر إرسال الرمز. حاول مرة أخرى."))
      } finally {
        setIsBusy(false)
      }
    },
    [email, name, needsNameUpfront, requestLoginCode, validateIdentity]
  )

  // ── التحقق من الرمز ───────────────────────────────────────
  const submitCode = useCallback(
    async (value: string, withName?: string) => {
      setApiError(null)
      setIsBusy(true)

      try {
        const result = await verifyLoginCode(
          email.trim(),
          value,
          withName ?? (needsNameUpfront ? name.trim() : undefined),
          redirectTo
        )

        // بريد جديد وصل من شاشة الدخول: نطلب الاسم ثم نعيد نفس الرمز
        if (result.needsName) {
          setPhase("name")
        }
      } catch (err: any) {
        setApiError(errorMessage(err, "الرمز غير صحيح. حاول مرة أخرى."))
        setCode("")
      } finally {
        setIsBusy(false)
      }
    },
    [email, name, needsNameUpfront, redirectTo, verifyLoginCode]
  )

  const submitName = useCallback(() => {
    if (name.trim().length < 2) {
      setFieldError({ name: "الاسم مطلوب (حرفان على الأقل)." })
      return
    }
    setFieldError({})
    void submitCode(code, name.trim())
  }, [name, code, submitCode])

  const maskedEmail = useMemo(() => email.trim(), [email])

  // ─────────────────────────────────────────────────────────
  //  المرحلة 1 — البريد (والاسم في شاشة الإنشاء)
  // ─────────────────────────────────────────────────────────
  if (phase === "identify") {
    return (
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void sendCode()
        }}
      >
        {apiError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {needsNameUpfront && (
          <Input
            label="الاسم"
            placeholder="مثال: أحمد الحربي"
            autoComplete="name"
            maxLength={100}
            value={name}
            error={fieldError.name}
            onChange={(event) => {
              setName(event.target.value)
              if (fieldError.name) setFieldError((p) => ({ ...p, name: undefined }))
            }}
          />
        )}

        <Input
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          className="text-left"
          placeholder="name@company.com"
          autoComplete="email"
          value={email}
          error={fieldError.email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (fieldError.email) setFieldError((p) => ({ ...p, email: undefined }))
          }}
        />

        <button
          type="submit"
          disabled={isBusy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الإرسال...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              أرسل رمز الدخول
            </>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          بلا كلمة مرور — نرسل لك رمزاً من 6 أرقام على بريدك، تكتبه هنا
          فتدخل مباشرةً.
        </p>
      </form>
    )
  }

  // ─────────────────────────────────────────────────────────
  //  المرحلة 3 — الاسم (بريد جديد جاء من شاشة الدخول)
  // ─────────────────────────────────────────────────────────
  if (phase === "name") {
    return (
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submitName()
        }}
      >
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          تم التحقق من بريدك ✓ — خطوة أخيرة: ما اسمك؟
        </div>

        {apiError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <Input
          label="الاسم"
          placeholder="مثال: أحمد الحربي"
          autoComplete="name"
          autoFocus
          maxLength={100}
          value={name}
          error={fieldError.name}
          onChange={(event) => {
            setName(event.target.value)
            if (fieldError.name) setFieldError({})
          }}
        />

        <button
          type="submit"
          disabled={isBusy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ إنشاء حسابك...
            </>
          ) : (
            "متابعة"
          )}
        </button>
      </form>
    )
  }

  // ─────────────────────────────────────────────────────────
  //  المرحلة 2 — الرمز
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600">
          <MailCheck className="h-7 w-7" />
        </span>
        <p className="text-sm leading-relaxed text-slate-600">
          أرسلنا رمزاً من 6 أرقام إلى
          <br />
          <span dir="ltr" className="font-semibold text-slate-900">
            {maskedEmail}
          </span>
        </p>
      </div>

      {apiError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={(value) => void submitCode(value)}
        disabled={isBusy}
        hasError={Boolean(apiError)}
      />

      {isBusy && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ التحقق...
        </div>
      )}

      <div className="flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          disabled={cooldown > 0 || isBusy}
          onClick={() => void sendCode(true)}
          className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {cooldown > 0
            ? `يمكنك إعادة الإرسال بعد ${cooldown} ثانية`
            : "لم يصلك الرمز؟ أعد الإرسال"}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            setPhase("identify")
            setCode("")
            setApiError(null)
          }}
          className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          تغيير البريد الإلكتروني
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        الرمز صالح لمدة 10 دقائق ويُستخدم مرّة واحدة.
      </p>
    </div>
  )
}

export default PasswordlessForm
