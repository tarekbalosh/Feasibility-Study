import React from "react";
import {
  FORCES_ORDER,
  PORTER_FORCE_CONFIG,
  FIELD_LABELS,
  type PorterForces,
  type PorterFactorsMap,
  type PorterFactorItem,
} from "@/types/porter";

interface PorterPrintDocumentProps {
  title: string;
  projectName?: string;
  industry?: string;
  countryRegion?: string;
  creationMode?: string;
  updatedAt?: string;
  forces: PorterForces;
  factors?: PorterFactorsMap;
}

export const PorterPrintDocument: React.FC<PorterPrintDocumentProps> = ({
  title,
  projectName,
  industry,
  countryRegion,
  creationMode = "manual",
  updatedAt,
  forces,
  factors,
}) => {
  const formattedDate = new Date(updatedAt || Date.now()).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const renderItems = (items: PorterFactorItem[] | undefined, fallbackText: string, trendIndexMap?: Map<string, number>) => {
    if (items && items.length > 0) {
      return (
        <ul className="flex flex-col gap-1.5 my-1 text-xs text-slate-800 leading-relaxed list-none">
          {items.map((item, idx) => {
            const parentIdx = item.parentFactorId && trendIndexMap ? trendIndexMap.get(item.parentFactorId) : null;
            return (
              <li key={item.id} className="flex items-start gap-2">
                <span className="font-bold text-slate-400 shrink-0 select-none">
                  {idx + 1}.
                </span>
                <span className="flex-1">
                  {item.content}
                  {parentIdx !== null && parentIdx !== undefined && (
                    <span className="text-[10px] text-slate-500 font-bold mr-1.5">
                      (من البند {parentIdx})
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      );
    }

    const lines = (fallbackText || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return (
        <div className="py-2 text-slate-400 italic text-xs">
          لا توجد بيانات مسجلة في هذا البند.
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-1.5 my-1 text-xs text-slate-800 leading-relaxed list-none">
        {lines.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="font-bold text-slate-400 shrink-0 select-none">
              {idx + 1}.
            </span>
            <span className="flex-1">{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="hidden print:block text-right bg-white p-6" dir="rtl">
      {/* ── Document Header ── */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Feasibility Suite — أداة التفكير الاستراتيجي
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-700">
              {creationMode === "ai"
                ? "ذكاء اصطناعي"
                : creationMode === "hybrid"
                ? "مختلط"
                : "يدوي"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            تحليل قوى بورتر الخمس — البيئة التنافسية (Porter's Five Forces)
          </h1>
          <p className="text-sm font-bold text-slate-700">
            {title} {projectName ? `• المشروع: ${projectName}` : ""}
          </p>
        </div>

        <div className="text-left text-xs text-slate-500 flex flex-col gap-1 font-medium">
          <div>
            <span className="font-bold text-slate-800">القطاع: </span>
            <span>{industry || "عام"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-800">السوق المستهدف: </span>
            <span>{countryRegion || "المملكة العربية السعودية"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-800">التاريخ: </span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* ── Table Layout matching the reference Spreadsheet ── */}
      <div className="flex flex-col gap-5">
        {FORCES_ORDER.map((forceKey) => {
          const config = PORTER_FORCE_CONFIG[forceKey];
          const forceData = forces[forceKey] || {
            trends: "",
            positiveImpacts: "",
            negativeImpacts: "",
          };
          const forceFactors = factors?.[forceKey];
          const trendIndexMap = new Map<string, number>();
          (forceFactors?.trends || []).forEach((t, i) => trendIndexMap.set(t.id, i + 1));

          return (
            <div
              key={forceKey}
              className="rounded-xl border border-slate-300 overflow-hidden break-inside-avoid shadow-none"
            >
              {/* Force Main Header Bar */}
              <div
                className="px-4 py-2 text-center font-black text-sm border-b border-slate-300"
                style={{ backgroundColor: config.colors.printHeaderBg }}
              >
                <span className="text-slate-900 font-extrabold text-base">
                  {config.order}. {config.title}
                </span>
                <span className="text-xs font-semibold text-slate-600 mr-2">
                  ({config.englishLabel})
                </span>
              </div>

              {/* Trends and Indicators Sub-section (Full Width) */}
              <div className="p-3 bg-white border-b border-slate-200">
                <div className="text-xs font-black text-slate-800 mb-1 pb-1 border-b border-slate-200">
                  {FIELD_LABELS.trends}
                </div>
                {renderItems(forceFactors?.trends, forceData.trends)}
              </div>

              {/* Impacts (2 Equal Columns: Positive on right, Negative on left in RTL) */}
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-200 bg-slate-50/30">
                {/* Positive Impacts (Right in RTL) */}
                <div className="p-3">
                  <div className="text-xs font-black text-emerald-800 mb-1 pb-1 border-b border-emerald-200 bg-emerald-50/60 -mx-3 -mt-3 p-2 rounded-t-none">
                    {FIELD_LABELS.positiveImpacts}
                  </div>
                  {renderItems(forceFactors?.positiveImpacts, forceData.positiveImpacts, trendIndexMap)}
                </div>

                {/* Negative Impacts (Left in RTL) */}
                <div className="p-3">
                  <div className="text-xs font-black text-rose-800 mb-1 pb-1 border-b border-rose-200 bg-rose-50/60 -mx-3 -mt-3 p-2 rounded-t-none">
                    {FIELD_LABELS.negativeImpacts}
                  </div>
                  {renderItems(forceFactors?.negativeImpacts, forceData.negativeImpacts, trendIndexMap)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print Footer */}
      <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-400">
        تم إعداد هذا التقرير عبر منصة Feasibility Suite — نموذج تحليل قوى بورتر الخمس
      </div>
    </div>
  );
};
