import React, { useState } from "react";
import { Shield } from "lucide-react";
import clsx from "clsx";
import type { SwotAnalysis } from "@/types/swot";
import { IntersectionStrategiesTab } from "./IntersectionStrategiesTab";
import { TraditionalStrategiesTab } from "./TraditionalStrategiesTab";
import { CustomGoalsTab } from "./CustomGoalsTab";

interface SwotStrategiesSectionProps {
  analysis: SwotAnalysis;
}

type TabType = "intersection" | "traditional" | "custom";

export const SwotStrategiesSection: React.FC<SwotStrategiesSectionProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState<TabType>("intersection");

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-400" />
          استراتيجيات التعامل مع تحليل SWOT
        </h3>
        <p className="text-sm text-slate-500">
          اختر الأسلوب الذي يناسبك للانتقال من التحليل إلى استراتيجيات قابلة للتنفيذ.
        </p>
      </div>

      <div className="border-b border-slate-200 mt-2">
        <nav className="-mb-px flex space-x-6 space-x-reverse" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("traditional")}
            className={clsx(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "traditional"
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            الاستراتيجيات التقليدية
          </button>
          
          <button
            onClick={() => setActiveTab("custom")}
            className={clsx(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "custom"
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            ضع أهدافك بنفسك
          </button>

          <button
            onClick={() => setActiveTab("intersection")}
            className={clsx(
              "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "intersection"
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            استراتيجية التقاطع
          </button>
        </nav>
      </div>

      <div className="mt-2 min-h-[300px]">
        {activeTab === "traditional" && <TraditionalStrategiesTab analysis={analysis} />}
        {activeTab === "custom" && <CustomGoalsTab analysis={analysis} />}
        {activeTab === "intersection" && <IntersectionStrategiesTab analysis={analysis} />}
      </div>
    </div>
  );
};
