import React, { useState } from "react";
import { ListChecks, Sparkles, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import type { SwotAnalysis, SwotStrategyKey, SwotQuadrantKey, SmartGoal } from "@/types/swot";
import { SmartGoalsModal } from "./SmartGoalsModal";

interface ReviewGoalsSectionProps {
  analysis: SwotAnalysis;
  goals: Record<string, string>;
  intersectionStrategies: Record<SwotStrategyKey, string[]>;
}

const QUADRANT_PREFIX: Record<SwotQuadrantKey, string> = {
  strengths: "ق",
  weaknesses: "ض",
  opportunities: "ف",
  threats: "ت", // Or 'خ' if we use مخاطر, but the prompt used "ت" for threats generally or "خ". Prompt says "ق١ ف٤", so Strengths(ق) and Opportunities(ف). Let's use ق, ض, ف, ت
};

const STRATEGY_LABELS: Record<SwotStrategyKey, string> = {
  so: "استراتيجية هجومية (قوة × فرصة)",
  wo: "استراتيجية تطويرية (ضعف × فرصة)",
  st: "استراتيجية دفاعية (قوة × تهديد)",
  wt: "استراتيجية انكفائية (ضعف × تهديد)",
};

const ar = (value: number): string => value.toLocaleString("ar-EG");

export const ReviewGoalsSection: React.FC<ReviewGoalsSectionProps> = ({
  analysis,
  goals,
  intersectionStrategies,
}) => {
  const [smartGoals, setSmartGoals]       = useState<SmartGoal[] | null>(null)
  const [isGenerating, setIsGenerating]   = useState(false)

  const handleGenerateSmart = async () => {
    setIsGenerating(true)
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

      // بناء سياق المشروع من ملخص التحليل
      const projectContext = analysis.summary
        ? `ملخص المشروع: ${analysis.summary}`
        : "مشروع تجاري يحتاج إلى خطة أهداف استراتيجية."

      const res = await fetch("/api/tools/swot-smart-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectContext,
          strengths:     analysis.strengths     ?? [],
          weaknesses:    analysis.weaknesses     ?? [],
          opportunities: analysis.opportunities  ?? [],
          threats:       analysis.threats        ?? [],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      if (!data?.goals?.length) throw new Error("لم تُعَد أي أهداف من النموذج.")
      setSmartGoals(data.goals)
    } catch (err: any) {
      toast.error(err?.message ?? "تعذّر توليد الأهداف الذكية. يرجى المحاولة لاحقاً.")
    } finally {
      setIsGenerating(false)
    }
  }
  // تجميع الأهداف من كلا المصدرين
  const allGoals: { goal: string; source: string; originalIndex?: number }[] = [];

  // 1. الأهداف من الاستراتيجيات التقليدية
  const quadrants: SwotQuadrantKey[] = ["strengths", "weaknesses", "opportunities", "threats"];
  
  quadrants.forEach((quadrant) => {
    const items = analysis[quadrant] || [];
    items.forEach((item, idx) => {
      const key = `${quadrant}-${idx}`;
      const goalText = goals[key];
      if (goalText?.trim()) {
        const sourceStr = `من ${QUADRANT_PREFIX[quadrant]}${ar(idx + 1)}`;
        allGoals.push({ goal: goalText.trim(), source: sourceStr });
      }
    });
  });

  const detectIntersectionSource = (strategyText: string, analysis: SwotAnalysis, key: SwotStrategyKey): string => {
    let sourceLabel = STRATEGY_LABELS[key];
    
    // Helper to find index of a matching item in a quadrant
    const findIndex = (quadrant: SwotQuadrantKey) => {
      const items = analysis[quadrant] || [];
      return items.findIndex(item => strategyText.includes(item.title) || item.title.includes(strategyText));
    };

    if (key === "so") {
      const sIndex = findIndex("strengths");
      const oIndex = findIndex("opportunities");
      if (sIndex !== -1 && oIndex !== -1) {
        sourceLabel = `استراتيجية هجومية (ق${ar(sIndex + 1)} × ف${ar(oIndex + 1)})`;
      } else if (sIndex !== -1) {
        sourceLabel = `استراتيجية هجومية (ق${ar(sIndex + 1)} × فرصة)`;
      } else if (oIndex !== -1) {
        sourceLabel = `استراتيجية هجومية (قوة × ف${ar(oIndex + 1)})`;
      }
    } else if (key === "wo") {
      const wIndex = findIndex("weaknesses");
      const oIndex = findIndex("opportunities");
      if (wIndex !== -1 && oIndex !== -1) {
        sourceLabel = `استراتيجية تطويرية (ض${ar(wIndex + 1)} × ف${ar(oIndex + 1)})`;
      } else if (wIndex !== -1) {
        sourceLabel = `استراتيجية تطويرية (ض${ar(wIndex + 1)} × فرصة)`;
      } else if (oIndex !== -1) {
        sourceLabel = `استراتيجية تطويرية (ضعف × ف${ar(oIndex + 1)})`;
      }
    } else if (key === "st") {
      const sIndex = findIndex("strengths");
      const tIndex = findIndex("threats");
      if (sIndex !== -1 && tIndex !== -1) {
        sourceLabel = `استراتيجية دفاعية (ق${ar(sIndex + 1)} × ت${ar(tIndex + 1)})`;
      } else if (sIndex !== -1) {
        sourceLabel = `استراتيجية دفاعية (ق${ar(sIndex + 1)} × تهديد)`;
      } else if (tIndex !== -1) {
        sourceLabel = `استراتيجية دفاعية (قوة × ت${ar(tIndex + 1)})`;
      }
    } else if (key === "wt") {
      const wIndex = findIndex("weaknesses");
      const tIndex = findIndex("threats");
      if (wIndex !== -1 && tIndex !== -1) {
        sourceLabel = `استراتيجية انكفائية (ض${ar(wIndex + 1)} × ت${ar(tIndex + 1)})`;
      } else if (wIndex !== -1) {
        sourceLabel = `استراتيجية انكفائية (ض${ar(wIndex + 1)} × تهديد)`;
      } else if (tIndex !== -1) {
        sourceLabel = `استراتيجية انكفائية (ضعف × ت${ar(tIndex + 1)})`;
      }
    }
    
    return sourceLabel;
  };

  // 2. الأهداف من استراتيجيات التقاطع
  const strategyKeys: SwotStrategyKey[] = ["so", "wo", "st", "wt"];
  strategyKeys.forEach((key) => {
    const strategies = intersectionStrategies[key] || [];
    strategies.forEach((strategyText) => {
      if (strategyText.trim()) {
        const sourceLabel = detectIntersectionSource(strategyText.trim(), analysis, key);
        allGoals.push({ goal: strategyText.trim(), source: sourceLabel });
      }
    });
  });

  const getBadgeStyle = (source: string) => {
    if (source.includes("هجومية") || source.includes("من ق")) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (source.includes("تطويرية") || source.includes("من ض")) return "bg-amber-50 text-amber-700 ring-amber-600/20";
    if (source.includes("من ف")) return "bg-sky-50 text-sky-700 ring-sky-600/20";
    if (source.includes("دفاعية") || source.includes("من ت") || source.includes("انكفائية")) return "bg-rose-50 text-rose-700 ring-rose-600/20";
    return "bg-slate-50 text-slate-600 ring-slate-500/20";
  };

  if (allGoals.length === 0) {
    return null;
  }

  return (
    <>
    <div className="mt-14 flex flex-col gap-8 border-t border-slate-100 pt-10">
      
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center p-2.5 bg-emerald-50/80 text-emerald-600 rounded-xl shadow-sm ring-1 ring-emerald-500/10">
            <ListChecks className="w-5 h-5" />
          </span>
          <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">
            استعراض الأهداف
          </h3>
        </div>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-2xl text-right">
          قائمة بجميع الأهداف الاستراتيجية التي تم استخراجها وصياغتها من التحليل (الاستراتيجيات التقليدية والتقاطعية).
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* جدول الأهداف الحديث */}
        <div className="w-full">
          <div className="overflow-x-auto pb-4 px-1">
            <table className="w-full text-right border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider w-20 text-center">رقم الهدف</th>
                  <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider">الهدف الاستراتيجي</th>
                  <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider w-48 text-center">المصدر</th>
                </tr>
              </thead>
              <tbody>
                {allGoals.map((g, index) => (
                  <tr key={index} className="group bg-white hover:bg-sky-50/40 transition-all duration-300 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md ring-1 ring-slate-200/60 hover:ring-sky-200">
                    <td className="px-6 py-5 text-center rounded-r-2xl">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-500 font-bold text-xs group-hover:bg-white group-hover:text-sky-600 group-hover:shadow-sm ring-1 ring-slate-200/50 transition-all">
                        {ar(index + 1)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-700 font-semibold leading-relaxed text-[14px]">
                      {g.goal}
                    </td>
                    <td className="px-6 py-5 text-center rounded-l-2xl">
                      <span className={clsx(
                        "inline-flex items-center justify-center px-4 py-2 rounded-xl text-[12px] font-bold leading-none whitespace-nowrap ring-1 ring-inset shadow-sm transition-colors group-hover:shadow-none",
                        getBadgeStyle(g.source)
                      )}>
                        {g.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* زر صياغة الأهداف بطريقة SMART */}
        <div className="w-full flex justify-end mt-2 mb-4">
          <button
            id="smart-goals-generate-btn"
            type="button"
            onClick={handleGenerateSmart}
            disabled={isGenerating}
            className="py-3.5 px-10 bg-[#5452F6] hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-full transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(84,82,246,0.8)] hover:shadow-[0_15px_35px_-10px_rgba(84,82,246,0.9)] hover:-translate-y-0.5 focus:ring-4 focus:ring-[#5452F6]/30 focus:outline-none flex justify-center items-center gap-2.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ التوليد...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                صياغة الأهداف بطريقة SMART
              </>
            )}
          </button>
        </div>
      </div>
    </div>

      {/* Modal نتائج SMART */}
      {smartGoals && (
        <SmartGoalsModal
          goals={smartGoals}
          onClose={() => setSmartGoals(null)}
        />
      )}
    </>
  );
};

export default ReviewGoalsSection;
