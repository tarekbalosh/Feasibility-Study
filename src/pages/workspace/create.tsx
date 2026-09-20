import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Cpu,
  Factory,
  Loader2,
  MoreHorizontal,
  Rocket,
  ShoppingBag,
  Users,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { EmailChipsInput } from "@/components/workspace/EmailChipsInput"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import * as workspaceService from "@/services/workspace.service"
import type { WorkspaceInviteDraft } from "@/types/workspace"
import { Breadcrumb } from "@/components/Breadcrumb"

/** الوجهة الافتراضية بعد الإنشاء حين لا يُمرَّر returnTo */
const DEFAULT_DESTINATION = "/tools"

/** طريقة البدء المختارة في الخطوة الثانية */
type StartMode = "solo" | "team" | null

/**
 * خيارات نوع النشاط — نفس التصنيف المستخدم في أداة دراسة الجدوى
 * (SectorSelector وProjectInfo)، فيبقى المصطلح موحّداً عبر المنصة.
 */
const INDUSTRY_OPTIONS = [
  { value: "تجاري", label: "تجاري", icon: ShoppingBag },
  { value: "صناعي", label: "صناعي", icon: Factory },
  { value: "خدمي", label: "خدمي", icon: Briefcase },
  { value: "تقني", label: "تقني", icon: Cpu },
  { value: "أخرى", label: "أخرى", icon: MoreHorizontal },
] as const

const STEPS = [
  { id: 1, title: "نشاط عملك", hint: "نوع النشاط (اختياري)" },
  { id: 2, title: "طريقة البدء", hint: "بمفردك أم مع فريق" },
]

// ─────────────────────────────────────────────────────────────
//  مؤشّر الخطوات
// ─────────────────────────────────────────────────────────────
const Stepper: React.FC<{ current: number }> = ({ current }) => (
  <ol className="flex items-center gap-3 sm:gap-5">
    {STEPS.map((step, index) => {
      const isDone = current > step.id
      const isActive = current === step.id

      return (
        <li key={step.id} className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-3">
            <span
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                isDone
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : isActive
                    ? "border-indigo-600 bg-white text-indigo-600"
                    : "border-slate-200 bg-white text-slate-400",
              ].join(" ")}
            >
              {isDone ? <Check className="h-4 w-4" /> : step.id}
            </span>
            <span className="hidden flex-col sm:flex">
              <span
                className={[
                  "text-sm font-bold",
                  isActive || isDone ? "text-slate-900" : "text-slate-400",
                ].join(" ")}
              >
                {step.title}
              </span>
              <span className="text-xs text-slate-400">{step.hint}</span>
            </span>
          </div>

          {index < STEPS.length - 1 && (
            <span
              className={[
                "h-0.5 w-8 rounded-full sm:w-16",
                isDone ? "bg-indigo-600" : "bg-slate-200",
              ].join(" ")}
            />
          )}
        </li>
      )
    })}
  </ol>
)

// ─────────────────────────────────────────────────────────────
//  بطاقة اختيار طريقة البدء
// ─────────────────────────────────────────────────────────────
const ModeCard: React.FC<{
  active: boolean
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}> = ({ active, icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={[
      "flex flex-1 flex-col items-start gap-3 rounded-2xl border-2 p-5 text-right transition-all duration-200",
      active
        ? "border-indigo-600 bg-indigo-50/60 shadow-sm shadow-indigo-100"
        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50",
    ].join(" ")}
  >
    <span
      className={[
        "flex h-11 w-11 items-center justify-center rounded-xl border",
        active
          ? "border-indigo-200 bg-indigo-100 text-indigo-600"
          : "border-slate-100 bg-slate-50 text-slate-500",
      ].join(" ")}
    >
      {icon}
    </span>
    <span className="text-base font-bold text-slate-900">{title}</span>
    <span className="text-sm leading-relaxed text-slate-500">{description}</span>
  </button>
)

// ─────────────────────────────────────────────────────────────
//  زر اختيار نوع النشاط
// ─────────────────────────────────────────────────────────────
const IndustryButton: React.FC<{
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}> = ({ active, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={[
      "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all duration-150",
      active
        ? "border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-sm shadow-indigo-100"
        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50",
    ].join(" ")}
  >
    <span
      className={[
        "flex h-9 w-9 items-center justify-center rounded-lg",
        active ? "bg-indigo-100 text-indigo-600" : "bg-slate-50 text-slate-500",
      ].join(" ")}
    >
      {icon}
    </span>
    <span className="text-sm font-semibold">{label}</span>
  </button>
)

// ─────────────────────────────────────────────────────────────
//  الصفحة
// ─────────────────────────────────────────────────────────────
function CreateWorkspacePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasWorkspace, isLoading: isWorkspaceLoading, setWorkspace, refresh } =
    useWorkspace()

  /**
   * اسم مساحة العمل — سبق أن أدخله المستخدم كاسم شركته في شاشة الدخول
   * الفوري (register)، فلا داعي لسؤاله عنه مرة ثانية هنا. مصدره الوحيد
   * الآن حساب المستخدم؛ لا حقل يعيد طلبه.
   */
  const name = user?.name?.trim() ?? ""

  const [step, setStep] = useState(1)
  const [industryChoice, setIndustryChoice] = useState<(typeof INDUSTRY_OPTIONS)[number]["value"] | null>(null)
  const [customIndustry, setCustomIndustry] = useState("")
  const [mode, setMode] = useState<StartMode>(null)
  const [invites, setInvites] = useState<WorkspaceInviteDraft[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customIndustryError, setCustomIndustryError] = useState<string | null>(null)

  /** القيمة الفعلية المُرسَلة للخادم — نص الزر المختار، أو ما كتبه المستخدم عند اختيار «أخرى» */
  const industry = industryChoice === "أخرى" ? customIndustry.trim() : industryChoice ?? ""

  /**
   * حارس التحويل — يضمن استدعاء router.replace مرّة واحدة.
   * بعد نجاح الإنشاء يصبح hasWorkspace صحيحاً، فيندفع مسارا تحويل
   * إلى الوجهة نفسها: أثر «من يملك مساحة» ونهايةُ دالة الإرسال.
   * Next يُجهض الأول ويسجّل «Abort fetching component for route».
   */
  const isRedirecting = useRef(false)

  /** الوجهة بعد النجاح — الأداة التي جاء منها المستخدم إن وُجدت */
  const destination = useMemo(() => {
    const returnTo = router.query.returnTo
    const value = Array.isArray(returnTo) ? returnTo[0] : returnTo
    // مسارات داخلية فقط: قيمة خارجية في returnTo تصبح تحويلاً مفتوحاً
    return value && value.startsWith("/") && !value.startsWith("//")
      ? value
      : DEFAULT_DESTINATION
  }, [router.query.returnTo])

  // من يملك مساحة عمل لا شأن له بهذه الصفحة — نُعيده إلى وجهته
  useEffect(() => {
    if (!router.isReady || isWorkspaceLoading) return
    if (!hasWorkspace || isRedirecting.current) return

    isRedirecting.current = true
    void router.replace(destination)
  }, [router, router.isReady, isWorkspaceLoading, hasWorkspace, destination])

  const goToStepTwo = useCallback(() => {
    // نوع النشاط اختياري — الحقل الوحيد الذي يستوجب تحققاً هو نص
    // «أخرى» المخصّص، ولا يُطلب إلا حين يختاره المستخدم فعلاً.
    if (industryChoice === "أخرى" && customIndustry.trim().length < 2) {
      setCustomIndustryError("اكتب نوع نشاطك (حرفان على الأقل) أو اختر تصنيفاً آخر.")
      return
    }

    setCustomIndustryError(null)
    setStep(2)
  }, [industryChoice, customIndustry])

  const submit = useCallback(
    async (withInvites: WorkspaceInviteDraft[]) => {
      const trimmedName = name.trim()

      // احتياط لا يُفترض بلوغه: كل مستخدم يملك اسماً منذ شاشة الدخول
      // الفوري، لكن جلسة معطوبة أو حساباً قديماً استثناءً يستحق رسالة
      // واضحة بدل فشل صامت في الخادم.
      if (trimmedName.length < 2) {
        toast.error("تعذّر التعرّف على اسم شركتك — يرجى تسجيل الخروج والدخول مجدداً.")
        return
      }

      setIsSubmitting(true)

      try {
        const result = await workspaceService.createWorkspace({
          name: trimmedName,
          industry: industry.trim() || undefined,
          invites: withInvites,
        })

        // حجز التحويل قبل تحديث الحالة: setWorkspace يجعل hasWorkspace
        // صحيحاً، والأثر أعلاه سيحاول التحويل فوراً لولا هذا الحارز.
        isRedirecting.current = true

        // تحديث الحالة قبل التحويل، وإلا اعترض الحارس المستخدم على
        // بابِ الأداة لأن الحالة لم تُجلب بعد.
        setWorkspace(result.workspace)

        toast.success(`تم إنشاء مساحة عملك «${result.workspace.name}» بنجاح 🎉`)

        if (result.invitesCreated > 0) {
          toast.success(
            result.invitesSent === result.invitesCreated
              ? `تم إرسال ${result.invitesCreated} دعوة إلى فريقك.`
              : `أُنشئت ${result.invitesCreated} دعوة، وأُرسل منها ${result.invitesSent}. يمكنك إعادة الإرسال من إعدادات المساحة.`
          )
        }

        await router.replace(destination)
        // مزامنة نهائية مع الخادم بعد التحويل — تلتقط الدعوات المسجّلة
        void refresh()
      } catch (error: any) {
        const message =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "تعذّر إنشاء مساحة العمل. يرجى المحاولة مرة أخرى."
        toast.error(message)
        // الإنشاء فشل فلا تحويل — نحرّر الحارس ليعمل مجدداً عند نجاح لاحق
        isRedirecting.current = false
        setIsSubmitting(false)
      }
    },
    [name, industry, setWorkspace, router, destination, refresh]
  )

  // شاشة انتظار حتى ينتهي فحص المساحة — تمنع وميض النموذج لمن يملك مساحة
  if (!router.isReady || isWorkspaceLoading || hasWorkspace) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 font-cairo"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">جارٍ التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 font-cairo" dir="rtl">
      <Head>
        <title>إنشاء مساحة العمل | Feasibility Suite</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
        {/* Breadcrumb Navigation */}
        <div className="-mb-4">
          <Breadcrumb />
        </div>

        {/* الترويسة */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/25">
            FS
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            أنشئ مساحة عملك الخاصة
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-slate-600">
            مساحة العمل هي بيت مشاريعك ودراساتك على المنصة — تجمع أدواتك
            ومخرجاتك وفريقك في مكان واحد. إنشاؤها خطوة واحدة، ولن تتكرّر.
          </p>
        </div>

        {/* مؤشّر الخطوات */}
        <div className="flex flex-col items-center gap-2">
          <Stepper current={step} />
          {/* عناوين الخطوات مخفيّة على الجوال ضيق العرض، فتبقى الدوائر
              بلا معنى. هذا السطر يعوّضها بعنوان الخطوة الحالية وحدها. */}
          <p className="text-xs font-semibold text-slate-500 sm:hidden">
            الخطوة {step} من {STEPS.length} — {STEPS[step - 1]?.title}
          </p>
        </div>

        {/* البطاقة */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100/60 sm:p-8">
          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900">
                    ما نوع نشاط «{name}»؟
                  </h2>
                  <p className="text-xs text-slate-500">
                    اختياري، ويمكنك تعديله لاحقاً من الإعدادات
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {INDUSTRY_OPTIONS.map((option) => (
                  <IndustryButton
                    key={option.value}
                    active={industryChoice === option.value}
                    icon={<option.icon className="h-4 w-4" />}
                    label={option.label}
                    onClick={() => {
                      setIndustryChoice(option.value)
                      if (customIndustryError) setCustomIndustryError(null)
                    }}
                  />
                ))}
              </div>

              {/* حقل نص حرّ — يظهر فقط حين لا يطابق نشاطُ العميل أياً من الأزرار أعلاه */}
              {industryChoice === "أخرى" && (
                <Input
                  label="حدّد نوع نشاطك"
                  placeholder="مثال: زراعة، طاقة متجددة، استشارات..."
                  value={customIndustry}
                  maxLength={100}
                  autoFocus
                  error={customIndustryError ?? undefined}
                  onChange={(event) => {
                    setCustomIndustry(event.target.value)
                    if (customIndustryError) setCustomIndustryError(null)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      goToStepTwo()
                    }
                  }}
                />
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={goToStepTwo}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-700"
                >
                  {industryChoice ? "التالي" : "تخطّي"}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                  <Rocket className="h-5 w-5" />
                </span>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900">
                    كيف تريد البدء؟
                  </h2>
                  <p className="text-xs text-slate-500">
                    مساحة «{name.trim()}» — يمكنك دعوة فريقك الآن أو لاحقاً
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <ModeCard
                  active={mode === "solo"}
                  icon={<Rocket className="h-5 w-5" />}
                  title="ابدأ بمفردك"
                  description="تُنشأ المساحة فوراً وتكون أنت مالكها والمشرف عليها. يمكنك دعوة فريقك في أي وقت لاحقاً."
                  onClick={() => setMode("solo")}
                />
                <ModeCard
                  active={mode === "team"}
                  icon={<Users className="h-5 w-5" />}
                  title="ادعُ فريق العمل الخاص بك"
                  description="ادعُ زملاءك بالبريد الإلكتروني وحدّد دور كل واحد منهم، وستصلهم روابط الانضمام فوراً."
                  onClick={() => setMode("team")}
                />
              </div>

              {/* نموذج الدعوات — يظهر عند اختيار «مع فريق» */}
              {mode === "team" && (
                <div className="animate-fade-in rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                  <EmailChipsInput
                    invites={invites}
                    onChange={setInvites}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* أزرار الإجراء */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(1)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  رجوع
                </button>

                <button
                  type="button"
                  disabled={!mode || isSubmitting}
                  onClick={() => submit(mode === "team" ? invites : [])}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جارٍ الإنشاء...
                    </>
                  ) : mode === "team" ? (
                    invites.length > 0 ? (
                      `إرسال الدعوات وإنشاء المساحة (${invites.length})`
                    ) : (
                      "إرسال الدعوات وإنشاء المساحة"
                    )
                  ) : (
                    "إنشاء مساحة العمل"
                  )}
                </button>
              </div>

              {mode === "team" && invites.length === 0 && (
                <p className="-mt-2 text-xs text-slate-500">
                  لم تضِف أي بريد بعد — ستُنشأ المساحة بك وحدك، ويمكنك دعوة
                  الفريق لاحقاً من الإعدادات.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * إنشاء مساحة العمل — خطوة إجبارية قبل استخدام أي أداة.
 * ProtectedRoute يضمن وجود جلسة؛ الصفحة نفسها تتكفّل بمن يملك مساحة.
 */
export default function CreateWorkspace() {
  return (
    <ProtectedRoute>
      <CreateWorkspacePage />
    </ProtectedRoute>
  )
}
