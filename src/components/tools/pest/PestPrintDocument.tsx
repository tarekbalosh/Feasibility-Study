import React from "react"
import {
  DIMENSIONS_ORDER,
  PEST_DIMENSION_CONFIG,
  CATEGORY_LABELS,
  CREATION_MODE_LABELS,
  type PestAnalysisDetail,
  type PestDimension,
  type PestCategory,
} from "@/types/pest"

interface PestPrintDocumentProps {
  analysis: PestAnalysisDetail
}

export const PestPrintDocument: React.FC<PestPrintDocumentProps> = ({ analysis }) => {
  const modeMeta = CREATION_MODE_LABELS[analysis.creationMode]
  const formattedDate = new Date(analysis.updatedAt || analysis.createdAt).toLocaleDateString(
    "ar-SA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  )

  // عدد السطور الافتراضية لعرض خطوط فارغة إن كان العمود يحتوي بنوداً قليلة
  const MIN_EMPTY_LINES = 3

  const renderLines = (dimension: PestDimension, category: PestCategory) => {
    const items = analysis.factors[dimension]?.[category] || []
    const emptyCount = Math.max(0, MIN_EMPTY_LINES - items.length)

    return (
      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-2 text-xs text-slate-900 leading-relaxed">
            <span className="font-bold text-slate-500 w-4 shrink-0 text-right">{idx + 1}.</span>
            <span className="flex-1 font-normal">{item.content}</span>
          </div>
        ))}

        {/* عرض خطوط فارغة للبيانات غير المكتملة كما في الصورة المرجعية */}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-2 h-5 border-b border-dashed border-slate-300 opacity-60"
          >
            <span className="text-[10px] text-slate-300 w-4">{items.length + i + 1}.</span>
            <div className="flex-1" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="hidden print:block text-right bg-white p-6" dir="rtl">
      {/* ترويسة التقرير المطبوع */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Feasibility Suite — CoreLogic Systems
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded border border-slate-300">
              {modeMeta.label}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            تحليل PEST — البيئة الخارجية
          </h1>
          <p className="text-sm font-semibold text-slate-700">
            {analysis.title} {analysis.projectName ? `(مشروع: ${analysis.projectName})` : ""}
          </p>
        </div>

        <div className="text-left text-xs text-slate-500 flex flex-col gap-1">
          <div>
            <span className="font-bold text-slate-700">القطاع: </span>
            <span>{analysis.industry || "عام"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">المنطقة: </span>
            <span>{analysis.countryRegion || "المملكة العربية السعودية"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">التاريخ: </span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* أقسام الأبعاد الخمسة بتنسيق الجدول الملون */}
      <div className="flex flex-col gap-5">
        {DIMENSIONS_ORDER.map((dim) => {
          const meta = PEST_DIMENSION_CONFIG[dim]

          return (
            <div
              key={dim}
              className="rounded-lg border border-slate-300 overflow-hidden break-inside-avoid"
            >
              {/* رأس البعد بلونه المميز */}
              <div
                className="px-4 py-2 font-bold text-sm border-b border-slate-300 flex items-center justify-between"
                style={{ backgroundColor: meta.colors.printBg }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-extrabold">{meta.title}</span>
                  <span className="text-xs font-normal text-slate-600">({meta.englishLabel})</span>
                </div>
                <span className="text-xs font-normal text-slate-700">{meta.description}</span>
              </div>

              {/* محتوى البعد */}
              <div className="p-3 flex flex-col gap-3 bg-white">
                {/* التوجهات والمؤشرات — عرض كامل */}
                <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">
                    {CATEGORY_LABELS.trend}
                  </div>
                  {renderLines(dim, "trend")}
                </div>

                {/* الانعكاسات الإيجابية والسلبية */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
                    <div className="text-xs font-bold text-emerald-800 mb-2 border-b border-slate-200 pb-1">
                      {CATEGORY_LABELS.positive_impact}
                    </div>
                    {renderLines(dim, "positive_impact")}
                  </div>

                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
                    <div className="text-xs font-bold text-rose-800 mb-2 border-b border-slate-200 pb-1">
                      {CATEGORY_LABELS.negative_impact}
                    </div>
                    {renderLines(dim, "negative_impact")}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* تذييل الصفحة المطبوعة */}
      <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-400">
        تم إعداد هذا التقرير عبر منصة Feasibility Suite — أداة التفكير الاستراتيجي والتحليل المؤسسي
      </div>
    </div>
  )
}

export default PestPrintDocument
