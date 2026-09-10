import React, { useEffect, useRef, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Grid2x2, Loader2 } from "lucide-react"
import { useSwotTool } from "@/hooks/useSwotTool"
import { SwotForm } from "@/components/tools/swot/SwotForm"
import { SwotResult } from "@/components/tools/swot/SwotResult"
import { SwotSelection } from "@/components/tools/swot/SwotSelection"

/** رسائل تتابع أثناء التوليد — نفس أسلوب شاشة توليد دراسة الجدوى */
const GENERATING_MESSAGES = [
  "نقرأ وصف مشروعك ونحدّد عوامله الداخلية…",
  "نفصل ما تملكه (قوة وضعف) عمّا يحيط بك (فرص وتهديدات)…",
  "نقيس موقعك أمام منافسي قطاعك…",
  "نستخرج الاستراتيجيات من تقاطعات المصفوفة…",
  "نصوغ الملخص التنفيذي…",
]

const GeneratingScreen: React.FC<{ projectName: string }> = ({ projectName }) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, GENERATING_MESSAGES.length - 1))
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-20 text-center" dir="rtl">
      <div className="mb-10 flex justify-center">
        <Loader2 className="w-16 h-16 text-sky-600 animate-spin" />
      </div>
      <div className="min-h-[80px] flex items-center justify-center">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 transition-opacity duration-500">
          {GENERATING_MESSAGES[index]}
        </h2>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        نحلّل «{projectName || "مشروعك"}» — قد يستغرق ذلك بضع ثوانٍ.
      </p>
      <div className="w-64 mx-auto mt-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-600 transition-all duration-1000 ease-linear"
          style={{
            width: `${((index + 1) / GENERATING_MESSAGES.length) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}

/**
 * مؤشّر حفظ التحليل في لوحة التحكم.
 * الحفظ تلقائي وصامت، لكن المستخدم يحتاج تأكيداً بصرياً أن عمله
 * لم يضِع — وتحذيراً حين يفشل، لأن التحليل حينها في متصفحه وحده.
 */
const SaveStatus: React.FC<{ state: "idle" | "saving" | "saved" | "error" }> = ({
  state,
}) => {
  if (state === "idle") return null

  const config = {
    saving: {
      className: "bg-slate-50 border-slate-200 text-slate-500",
      text: "جارٍ الحفظ في لوحة التحكم...",
    },
    saved: {
      className: "bg-emerald-50 border-emerald-200 text-emerald-700",
      text: "محفوظ في لوحة التحكم ✓",
    },
    error: {
      className: "bg-amber-50 border-amber-200 text-amber-800",
      text: "تعذّر الحفظ في لوحة التحكم — التحليل محفوظ في متصفحك، وسيُحاول الحفظ مجدداً عند أي تعديل.",
    },
  }[state]

  return (
    <div
      className={`mb-4 flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold ${config.className}`}
      role="status"
    >
      {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {config.text}
    </div>
  )
}

/**
 * أداة تحليل SWOT — تُحمّل عبر سجلّ الأدوات على المسار
 * /tools/swot/start
 */
export const SwotTool: React.FC = () => {
  const {
    input,
    setField,
    errors,
    phase,
    analysis,
    selections,
    conflicts,
    totalSelected,
    customErrors,
    maxCustomItems,
    goToSelection,
    backToForm,
    toggleSelection,
    addCustomItem,
    editCustomItem,
    removeCustomItem,
    clearCustomError,
    clearCategory,
    generateError,
    generate,
    skipSelection,
    removeItem,
    editItem,
    editInput,
    editSelection,
    showResult,
    reset,
    saveState,
    loadSavedRun,
  } = useSwotTool()

  // ── فتح تحليل محفوظ قادم من لوحة التحكم (/tools/swot/start?run=...) ──
  const router = useRouter()
  const loadedRunRef = useRef<string | null>(null)

  useEffect(() => {
    if (!router.isReady) return

    const raw = router.query.run
    const runId = Array.isArray(raw) ? raw[0] : raw
    if (!runId || loadedRunRef.current === runId) return

    // المرجع يمنع إعادة التحميل عند كل تصيير، فيبقى تعديل المستخدم
    loadedRunRef.current = runId
    void loadSavedRun(runId)
  }, [router.isReady, router.query.run, loadSavedRun])

  return (
    <div
      className="bg-gray-50 min-h-screen py-6 sm:py-12 px-3 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <Head>
        <title>أداة تحليل SWOT الذكية | Feasibility Suite</title>
        <meta
          name="description"
          content="أنشئ مصفوفة SWOT رباعية لمشروعك بالذكاء الاصطناعي، مع استراتيجيات مستخرجة من تقاطعات المصفوفة."
        />
      </Head>

      <div className="max-w-5xl mx-auto">
        {/* الترويسة */}
        <div className="text-center mb-10 print:hidden">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
              <Grid2x2 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              أداة تحليل SWOT الذكية
            </h1>
          </div>
          <p className="text-slate-500 text-base sm:text-lg">
            صِف مشروعك، وسنبني لك مصفوفة رباعية واستراتيجيات عملية مستخرجة منها.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-10 print:shadow-none print:border-none print:p-0 print:rounded-none">
          {phase === "generating" ? (
            <GeneratingScreen projectName={input.projectName} />
          ) : phase === "selection" ? (
            <SwotSelection
              projectName={input.projectName}
              selections={selections}
              conflicts={conflicts}
              totalSelected={totalSelected}
              customErrors={customErrors}
              maxCustomItems={maxCustomItems}
              generateError={generateError}
              onToggle={toggleSelection}
              onAddCustom={addCustomItem}
              onEditCustom={editCustomItem}
              onRemoveCustom={removeCustomItem}
              onClearCustomError={clearCustomError}
              onClearCategory={clearCategory}
              onGenerate={generate}
              onSkip={skipSelection}
              onBack={backToForm}
            />
          ) : phase === "result" && analysis ? (
            <>
              {/* حالة الحفظ في لوحة التحكم — سطر خفيف لا يزاحم النتيجة */}
              <SaveStatus state={saveState} />
              <SwotResult
                input={input}
                analysis={analysis}
                onEditInput={editInput}
                onEditSelection={editSelection}
                onRegenerate={generate}
                onReset={reset}
                removeItem={removeItem}
                editItem={editItem}
              />
            </>
          ) : (
            <SwotForm
              input={input}
              errors={errors}
              setField={setField}
              onSubmit={goToSelection}
              hasAnalysis={Boolean(analysis)}
              onBackToResult={analysis ? showResult : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SwotTool
