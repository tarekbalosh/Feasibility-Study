import React from "react"
import clsx from "clsx"
import {
  HORIZON_LABELS,
  PLATFORM_NAME,
  PrioritiesShortfallNote,
  QUADRANTS,
  ReportDisclaimer,
  ReportMetaBox,
  STRATEGY_GROUPS,
  horizonBadgeClass,
  prioritySourceLabel,
} from "./reportMeta"
import { formatReportDate } from "@/utils/swotReport"
import { MAX_PRIORITIES, type SwotAnalysis, type SwotInput } from "@/types/swot"

/**
 * ─────────────────────────────────────────────────────────────
 *  مستند التقرير — نسخة التصدير (PDF عبر الطباعة)
 * ─────────────────────────────────────────────────────────────
 *  لا يحمل زرّاً ولا حقلاً ولا أي عنصر تفاعلي: لا يُمرَّر إليه أي
 *  رد نداء أصلاً، فاستحالة ظهور زر في الملف المصدَّر مضمونة بالبنية
 *  لا بالانضباط. يقرأ نفس بيانات SwotReportView.
 *
 *  الترويسة والتذييل مثبّتان (position: fixed داخل @media print) فيعيد
 *  المتصفح رسمهما في كل صفحة. أمّا ترقيم «صفحة X من Y» فلا يدعمه
 *  window.print في كروم (صناديق هوامش @page غير مدعومة)، وتحقيقه
 *  يحتاج توليد PDF على الخادم.
 * ─────────────────────────────────────────────────────────────
 */

const ar = (value: number): string => value.toLocaleString("ar-EG")

export const SwotReportDocument: React.FC<{
  input: SwotInput
  analysis: SwotAnalysis
}> = ({ input, analysis }) => {
  // تقرير ناقص يُطبع ناقصاً ولا ينهار — انظر التعليق في SwotReportView
  const priorities = analysis.priorities ?? []

  return (
  <div className="hidden print:block swot-doc" dir="rtl">
    {/* ترويسة تتكرّر في كل صفحة مطبوعة */}
    <div className="swot-doc__header">
      <div className="flex items-center gap-2">
        <span className="swot-doc__mark">FS</span>
        <span className="text-[11px] font-bold text-slate-700">
          {PLATFORM_NAME}
        </span>
      </div>
      <span className="text-[10px] text-slate-500">
        تحليل SWOT — {input.projectName || "مشروع"}
      </span>
    </div>

    <div className="swot-doc__body">
      {/* عنوان التقرير */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">
          تحليل SWOT — {input.projectName}
        </h1>
        <p className="text-[11px] text-slate-500 mt-1">
          {input.sector} · {formatReportDate(analysis.generatedAt)} ·{" "}
          {analysis.id}
        </p>
      </div>

      {/* الملخص التنفيذي */}
      <section className="swot-doc__block rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 mb-5">
        <span className="text-[10px] font-bold text-slate-500 tracking-wider">
          الملخص التنفيذي
        </span>
        <p className="text-[12px] leading-relaxed text-slate-800 mt-1">
          {analysis.summary}
        </p>
      </section>

      {/* المصفوفة الرباعية */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {QUADRANTS.map((quadrant) => (
          <section
            key={quadrant.key}
            className={clsx(
              "swot-doc__block bg-white border rounded-xl overflow-hidden",
              quadrant.ring
            )}
          >
            <div className={clsx("flex items-center gap-2 px-3 py-2", quadrant.header)}>
              <span
                className={clsx(
                  "w-6 h-6 rounded-md text-white text-[11px] font-black flex items-center justify-center shrink-0",
                  quadrant.chip
                )}
              >
                {quadrant.letter}
              </span>
              <span className="flex flex-col">
                <span className="text-[12px] font-bold">{quadrant.title}</span>
                <span className="text-[9px] opacity-80">{quadrant.subtitle}</span>
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 p-3">
              {(analysis[quadrant.key] ?? []).map((item, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span
                    className={clsx(
                      "w-1 h-1 rounded-full shrink-0 mt-1.5",
                      quadrant.dot
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-800 leading-snug">
                      {item.title}
                    </span>
                    {item.detail && (
                      <span className="text-[10px] text-slate-500 leading-relaxed">
                        {item.detail}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* الاستراتيجيات */}
      <h2 className="text-sm font-bold text-slate-900 mb-2">
        الاستراتيجيات المستخرجة من تقاطعات المصفوفة
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {STRATEGY_GROUPS.map((group) => (
          <section
            key={group.key}
            className={clsx(
              "swot-doc__block rounded-xl border px-3 py-2.5",
              group.accent
            )}
          >
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-[12px] font-bold">{group.title}</span>
              <span className="text-[9px] opacity-70">{group.formula}</span>
            </div>
            <ol className="flex flex-col gap-1">
              {(analysis.strategies?.[group.key] ?? []).map((strategy, index) => (
                <li
                  key={index}
                  className="text-[11px] leading-relaxed text-slate-700"
                >
                  {ar(index + 1)}. {strategy}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {/* أ) الأولويات — أول ما يُقرأ بعد التحليل */}
      <section className="swot-doc__block rounded-xl border-2 border-slate-800 bg-white px-4 py-3.5 mb-5">
        <h2 className="text-sm font-bold text-slate-900">
          ابدأ من هنا — أولويات الـ ٩٠ يوماً
        </h2>
        <p className="text-[10px] text-slate-500 mb-2.5">
          مشتقّة من استراتيجيات هذا التقرير، لا إضافات خارجه.
        </p>

        {priorities.length === 0 ? (
          <PrioritiesShortfallNote count={0} />
        ) : (
          <ol className="flex flex-col gap-2.5">
            {priorities.map((priority, index) => {
              const source = prioritySourceLabel(
                analysis,
                priority.sourceStrategyId
              )
              return (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 shrink-0 rounded-md bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                    {ar(index + 1)}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-bold text-slate-900">
                        {priority.action}
                      </span>
                      <span className={horizonBadgeClass(priority.horizon)}>
                        {HORIZON_LABELS[priority.horizon]}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 leading-relaxed">
                      السبب: {priority.rationale}
                    </span>
                    <span className="text-[10px] text-slate-600 leading-relaxed">
                      مؤشر النجاح: {priority.successMetric}
                    </span>
                    {source && (
                      <span className="text-[9px] text-slate-400 leading-relaxed">
                        مشتقّة من: {source}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {priorities.length > 0 &&
          priorities.length < MAX_PRIORITIES && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200">
              <PrioritiesShortfallNote count={priorities.length} />
            </div>
          )}
      </section>

      {/* ج) بيانات التقرير */}
      <div className="swot-doc__block mb-4">
        <ReportMetaBox input={input} analysis={analysis} />
      </div>

      {/* د) إخلاء المسؤولية */}
      <div className="swot-doc__block">
        <ReportDisclaimer analysis={analysis} />
      </div>
    </div>

    {/* تذييل يتكرّر في كل صفحة مطبوعة */}
    <div className="swot-doc__footer">
      <span>
        {input.projectName || "مشروع"} · {input.sector}
      </span>
      <span>
        {formatReportDate(analysis.generatedAt)} · {analysis.id}
      </span>
    </div>
  </div>
  )
}

export default SwotReportDocument
