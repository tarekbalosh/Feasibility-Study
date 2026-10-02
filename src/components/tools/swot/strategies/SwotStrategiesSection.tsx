import React, { useState } from "react";
import { Shield } from "lucide-react";
import clsx from "clsx";
import type { SwotAnalysis, SwotStrategyKey } from "@/types/swot";
import { IntersectionStrategiesTab } from "./IntersectionStrategiesTab";
import { TraditionalStrategiesTab } from "./TraditionalStrategiesTab";
import { ReviewGoalsSection } from "./ReviewGoalsSection";
import { TaskManagementSection } from "./TaskManagementSection";

interface SwotStrategiesSectionProps {
  analysis: SwotAnalysis;
  showGoalsMode: boolean;
  setShowGoalsMode: (show: boolean) => void;
}

type TabType = "intersection" | "traditional";

export const SwotStrategiesSection: React.FC<SwotStrategiesSectionProps> = ({ analysis, showGoalsMode, setShowGoalsMode }) => {
  const [activeTab, setActiveTab] = useState<TabType>("traditional");

  // مرفوع من TraditionalStrategiesTab
  const [goals, setGoals] = useState<Record<string, { text: string; isAi: boolean }[]>>({});

  // مرفوع من IntersectionStrategiesTab
  const [intersectionStrategies, setIntersectionStrategies] = useState<Record<SwotStrategyKey, string[]>>({
    so: analysis.strategies?.so || [],
    wo: analysis.strategies?.wo || [],
    st: analysis.strategies?.st || [],
    wt: analysis.strategies?.wt || [],
  });

  // حالة الأهداف المحولة لـ SMART
  const [smartifiedGoals, setSmartifiedGoals] = useState<Record<string, string>>({});

  const [showTasksMode, setShowTasksMode] = useState(false);

  if (showTasksMode) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
           <button onClick={() => setShowTasksMode(false)} className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6"/></svg>
           </button>
           <div>
             <h2 className="text-[22px] font-bold text-slate-900">إدارة المهام الاستراتيجية</h2>
             <p className="text-sm text-slate-500 mt-1">هنا يمكنك تقسيم أهدافك الاستراتيجية إلى مهام تنفيذية وتوزيعها على الفريق.</p>
           </div>
        </div>
        <TaskManagementSection 
          analysis={analysis} 
          goals={goals} 
          intersectionStrategies={intersectionStrategies} 
          smartifiedGoals={smartifiedGoals}
          setSmartifiedGoals={setSmartifiedGoals}
        />
      </div>
    );
  }

  if (showGoalsMode) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
           <button onClick={() => setShowGoalsMode(false)} className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6"/></svg>
           </button>
           <div>
             <h2 className="text-[22px] font-bold text-slate-900">استعراض الأهداف الاستراتيجية</h2>
             <p className="text-sm text-slate-500 mt-1">قائمة بجميع الأهداف الاستراتيجية التي تم استخراجها وصياغتها من التحليل (الاستراتيجيات التقليدية والتقاطعية).</p>
           </div>
        </div>
        <ReviewGoalsSection 
          analysis={analysis} 
          goals={goals} 
          intersectionStrategies={intersectionStrategies} 
          smartifiedGoals={smartifiedGoals}
          setSmartifiedGoals={setSmartifiedGoals}
        />
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setShowTasksMode(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#5452F6] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
          >
            التالي: إدارة المهام
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </div>
      </div>
    );
  }

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

      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button
          onClick={() => setShowGoalsMode(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
        >
          التالي: استعراض الأهداف
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>
    </div>
  );
};
