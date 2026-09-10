import React, { useCallback, useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/context/AuthContext"

/** مراحل الشاشة: إدخال البريد ← (اسم الشركة، إن كان البريد جديداً) */
type Phase = "identify" | "name"

interface PasswordlessFormProps {
  /**
   * signup: شاشة إنشاء مساحة العمل — اسم الشركة يُطلب مع البريد ابتداءً.
   * login:  شاشة الدخول — البريد وحده، واسم الشركة لا يُطلب إلا إن
   *         تبيّن أن البريد لا حساب له.
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
 * الدخول الفوري بالبريد واسم الشركة — بلا كلمة مرور وبلا رمز تحقق.
 *
 * الحساب يُنشأ فوراً عند أول بريد جديد، ويُفتح مباشرة لبريد قائم.
 * هذه الشاشة نفسها هي "تسجيل الدخول" الوحيد على المنصة الآن.
 */
export const PasswordlessForm: React.FC<PasswordlessFormProps> = ({
  mode,
  redirectTo,
}) => {
  const { instantAccess } = useAuth()

  const [phase, setPhase] = useState<Phase>("identify")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState<{ name?: string; email?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const needsNameUpfront = mode === "signup"

  const validateIdentity = useCallback((): boolean => {
    const errors: { name?: string; email?: string } = {}

    if (needsNameUpfront && name.trim().length < 2) {
      errors.name = "اسم الشركة مطلوب (حرفان على الأقل)."
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errors.email = "أدخل بريداً إلكترونياً صحيحاً."
    }

    setFieldError(errors)
    return Object.keys(errors).length === 0
  }, [name, email, needsNameUpfront])

  // ── الدخول الفوري ─────────────────────────────────────────
  const submitIdentity = useCallback(
    async (withName?: string) => {
      setApiError(null)
      setIsBusy(true)

      try {
        const result = await instantAccess(
          email.trim(),
          withName ?? (needsNameUpfront ? name.trim() : undefined),
          redirectTo
        )

        // بريد جديد وصل من شاشة الدخول: نطلب اسم الشركة ثم نعيد المحاولة
        if (result.needsName) {
          setPhase("name")
        }
      } catch (err: any) {
        setApiError(errorMessage(err, "تعذّر الدخول. حاول مرة أخرى."))
      } finally {
        setIsBusy(false)
      }
    },
    [email, name, needsNameUpfront, redirectTo, instantAccess]
  )

  const submitName = useCallback(() => {
    if (name.trim().length < 2) {
      setFieldError({ name: "اسم الشركة مطلوب (حرفان على الأقل)." })
      return
    }
    setFieldError({})
    void submitIdentity(name.trim())
  }, [name, submitIdentity])

  // ─────────────────────────────────────────────────────────
  //  المرحلة 1 — البريد (واسم الشركة في شاشة الإنشاء)
  // ─────────────────────────────────────────────────────────
  if (phase === "identify") {
    return (
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!validateIdentity()) return
          void submitIdentity()
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
            label="اسم الشركة"
            placeholder="مثال: شركة الحربي للتقنية"
            autoComplete="organization"
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
              جارٍ الدخول...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {needsNameUpfront ? "أنشئ مساحة عملك" : "دخول"}
            </>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          بلا كلمة مرور وبلا رمز تحقق — أدخل بريدك وستدخل مباشرةً.
        </p>
      </form>
    )
  }

  // ─────────────────────────────────────────────────────────
  //  المرحلة 2 — اسم الشركة (بريد جديد جاء من شاشة الدخول)
  // ─────────────────────────────────────────────────────────
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        submitName()
      }}
    >
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        هذا بريد جديد — خطوة أخيرة: ما اسم شركتك؟
      </div>

      {apiError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <Input
        label="اسم الشركة"
        placeholder="مثال: شركة الحربي للتقنية"
        autoComplete="organization"
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
          "أنشئ مساحة عملك"
        )}
      </button>
    </form>
  )
}

export default PasswordlessForm
