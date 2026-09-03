import React, { useEffect, useState } from "react"
import Head from "next/head"
import Link from "next/link"
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
    removeCustomItem,
    clearCustomError,
    clearCategory,
    generateError,
    generate,
    skipSelection,
    removeItem,
    editInput,
    editSelection,
    showResult,
    reset,
  } = useSwotTool()

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
            href="/tools/swot"
            className="inline-block mt-3 text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← تعرّف على الأداة أولاً
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
              onRemoveCustom={removeCustomItem}
              onClearCustomError={clearCustomError}
              onClearCategory={clearCategory}
              onGenerate={generate}
              onSkip={skipSelection}
              onBack={backToForm}
            />
          ) : phase === "result" && analysis ? (
            <SwotResult
              input={input}
              analysis={analysis}
              onEditInput={editInput}
              onEditSelection={editSelection}
              onRegenerate={generate}
              onReset={reset}
              removeItem={removeItem}
            />
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
