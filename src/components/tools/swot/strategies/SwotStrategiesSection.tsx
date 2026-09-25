import React, { useState } from "react";
import { Shield } from "lucide-react";
import clsx from "clsx";
import type { SwotAnalysis, SwotStrategyKey } from "@/types/swot";
import { IntersectionStrategiesTab } from "./IntersectionStrategiesTab";
import { TraditionalStrategiesTab } from "./TraditionalStrategiesTab";
import { ReviewGoalsSection } from "./ReviewGoalsSection";

interface SwotStrategiesSectionProps {
  analysis: SwotAnalysis;
}

type TabType = "intersection" | "traditional";

export const SwotStrategiesSection: React.FC<SwotStrategiesSectionProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState<TabType>("traditional");

  // مرفوع من TraditionalStrategiesTab
  const [goals, setGoals] = useState<Record<string, string>>({});

  // مرفوع من IntersectionStrategiesTab
  const [intersectionStrategies, setIntersectionStrategies] = useState<Record<SwotStrategyKey, string[]>>({
    so: analysis.strategies?.so || [],
    wo: analysis.strategies?.wo || [],
    st: analysis.strategies?.st || [],
    wt: analysis.strategies?.wt || [],
  });

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex flex-col gap-1.5 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center p-2.5 bg-indigo-50/80 text-indigo-600 rounded-xl shadow-sm ring-1 ring-indigo-500/10">
            <Shield className="w-5 h-5" />
          </span>
          <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">
            استراتيجيات التعامل مع تحليل SWOT
          </h3>
        </div>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-2xl text-right">
          اختر الأسلوب الذي يناسبك للانتقال من التحليل إلى استراتيجيات قابلة للتنفيذ.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("traditional")}
            className={clsx(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-all duration-200",
              activeTab === "traditional"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            الاستراتيجيات التقليدية
          </button>
          
          <button
            onClick={() => setActiveTab("intersection")}
            className={clsx(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-all duration-200",
              activeTab === "intersection"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            استراتيجية التقاطع
          </button>
        </nav>
      </div>

      <div className="mt-2 min-h-[300px]">
        {activeTab === "traditional" && (
          <TraditionalStrategiesTab 
            analysis={analysis} 
            goals={goals} 
            setGoals={setGoals} 
          />
        )}
        {activeTab === "intersection" && (
          <IntersectionStrategiesTab 
            analysis={analysis} 
            strategies={intersectionStrategies} 
            setStrategies={setIntersectionStrategies} 
          />
        )}
      </div>

      <ReviewGoalsSection 
        analysis={analysis} 
        goals={goals} 
        intersectionStrategies={intersectionStrategies} 
      />
    </div>
  );
};
