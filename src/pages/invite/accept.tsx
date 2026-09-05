import React, { useCallback, useEffect, useMemo, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import * as workspaceService from "@/services/workspace.service"
import { ROLE_LABELS, type InvitePreview } from "@/types/workspace"

/** حالات الشاشة */
type Phase = "loading" | "ready" | "accepting" | "accepted" | "error"

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 px-4 py-12 font-cairo"
    dir="rtl"
  >
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100/60">
      {children}
    </div>
  </div>
)

/**
 * قبول دعوة الانضمام إلى مساحة عمل — /invite/accept?token=...
 *
 * الرمز يُعاين أولاً بلا تسجيل دخول (اسم المساحة والدور)، ثم يُطلب
 * تسجيل الدخول ببريد المدعو نفسه قبل تنفيذ القبول. الخادم هو الذي
 * يتحقق من الرمز وصلاحيته وتطابق البريد؛ ما هنا عرضٌ لنتيجته.
 */
export default function AcceptInvitePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth()
  const { setWorkspace, refresh } = useWorkspace()

  const [phase, setPhase] = useState<Phase>("loading")
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const token = useMemo(() => {
    const raw = router.query.token
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? ""
  }, [router.query.token])

  /** رابط العودة إلى هذه الصفحة بعد تسجيل الدخول أو إنشاء الحساب */
  const returnTo = useMemo(
    () => encodeURIComponent(`/invite/accept?token=${token}`),
    [token]
  )

  // ── معاينة الدعوة ────────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return

    if (!token) {
      setError("رابط الدعوة غير مكتمل. تأكد من نسخه كاملاً من رسالة البريد.")
      setPhase("error")
      return
    }

    let cancelled = false

    workspaceService
      .getInvitePreview(token)
      .then((preview) => {
        if (cancelled) return
        setInvite(preview)
        setPhase("ready")
      })
      .catch((err: any) => {
        if (cancelled) return
        setError(
          err?.response?.data?.error?.message ||
            "رابط الدعوة غير صالح أو انتهت صلاحيته."
        )
        setPhase("error")
      })

    return () => {
      cancelled = true
    }
  }, [router.isReady, token])

  // ── تنفيذ القبول ─────────────────────────────────────────
  const accept = useCallback(async () => {
    setPhase("accepting")

    try {
      const workspace = await workspaceService.acceptInvite(token)

      if (workspace) setWorkspace(workspace)
      void refresh()

      setPhase("accepted")
      toast.success(
        `انضممت إلى مساحة العمل «${workspace?.name ?? invite?.workspaceName}» بنجاح 🎉`
      )

      // مهلة قصيرة ليقرأ المستخدم رسالة النجاح قبل التحويل
      setTimeout(() => router.replace("/tools"), 1800)
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "تعذّر قبول الدعوة. حاول مرة أخرى أو اطلب دعوة جديدة."
      )
      setPhase("error")
    }
  }, [token, setWorkspace, refresh, invite, router])

  // ── شاشات الحالة ─────────────────────────────────────────

  if (phase === "loading" || isAuthLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">
            جارٍ التحقق من الدعوة...
          </p>
        </div>
      </Shell>
    )
  }

  if (phase === "error") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">تعذّر قبول الدعوة</h1>
          <p className="text-sm leading-relaxed text-slate-600">{error}</p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            العودة إلى الصفحة الرئيسية
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    )
  }

  if (phase === "accepted") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            انضممت إلى «{invite?.workspaceName}» 🎉
          </h1>
          <p className="text-sm text-slate-600">
            جارٍ تحويلك إلى أدوات المنصة...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </div>
      </Shell>
    )
  }

  // phase === "ready" | "accepting"
  const isSameEmail =
    isAuthenticated &&
    user?.email?.trim().toLowerCase() === invite?.email.trim().toLowerCase()

  return (
    <>
      <Head>
        <title>دعوة للانضمام إلى مساحة عمل | Feasibility Suite</title>
        <meta name="robots" content="noindex" />
      </Head>

      <Shell>
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7" />
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              دعوة للانضمام إلى «{invite?.workspaceName}»
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              تمت دعوتك بصفة{" "}
              <strong className="text-indigo-600">
                {ROLE_LABELS[invite?.role ?? "member"]}
              </strong>{" "}
              على البريد{" "}
              <span dir="ltr" className="font-semibold text-slate-800">
                {invite?.email}
              </span>
            </p>
          </div>

          {/* غير مسجَّل دخول — يجب تسجيل الدخول أو إنشاء حساب أولاً */}
          {!isAuthenticated && (
            <div className="flex w-full flex-col gap-3">
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                سجّل الدخول بالبريد المدعو، أو أنشئ حساباً به، ثم ستعود إلى هذه
                الصفحة تلقائياً لإتمام الانضمام.
              </p>
              <Link
                href={`/auth/login?returnTo=${returnTo}`}
                className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                تسجيل الدخول
              </Link>
              <Link
                href={`/auth/register?returnTo=${returnTo}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                إنشاء حساب جديد
              </Link>
            </div>
          )}

          {/* مسجَّل دخول ببريد مختلف — القبول سيُرفض من الخادم، فنوضّح مبكراً */}
          {isAuthenticated && !isSameEmail && (
            <div className="flex w-full flex-col gap-3">
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                أنت مسجَّل دخول بحساب{" "}
                <span dir="ltr" className="font-semibold">
                  {user?.email}
                </span>
                ، بينما الدعوة موجَّهة إلى{" "}
                <span dir="ltr" className="font-semibold">
                  {invite?.email}
                </span>
                . سجّل الخروج ثم ادخل بالبريد المدعو لقبول الدعوة.
              </p>
              <Link
                href={`/auth/login?returnTo=${returnTo}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                تسجيل الدخول بحساب آخر
              </Link>
            </div>
          )}

          {/* الحالة السعيدة */}
          {isSameEmail && (
            <button
              type="button"
              disabled={phase === "accepting"}
              onClick={accept}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase === "accepting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الانضمام...
                </>
              ) : (
                "قبول الدعوة والانضمام"
              )}
            </button>
          )}

          <p className="text-xs text-slate-400">
            إن لم تكن تتوقّع هذه الدعوة، يمكنك تجاهل هذه الصفحة بأمان.
          </p>
        </div>
      </Shell>
    </>
  )
}
