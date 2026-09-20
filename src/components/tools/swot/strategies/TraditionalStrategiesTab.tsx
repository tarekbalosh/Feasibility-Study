import React, { useState } from "react"
import { Sparkles, Target, ArrowRight } from "lucide-react"
import type { SwotAnalysis, SwotItem, SwotQuadrantKey } from "@/types/swot"

interface TraditionalStrategiesTabProps {
  analysis: SwotAnalysis
}

const QUADRANT_CONFIG: Record<SwotQuadrantKey, { title: string; color: string; bg: string; rule: string }> = {
  strengths: { title: "نقاط القوة", color: "text-emerald-700", bg: "bg-emerald-50", rule: "الحفاظ عليها او تعزيزها" },
  weaknesses: { title: "نقاط الضعف", color: "text-rose-700", bg: "bg-rose-50", rule: "علاجها او التخلص منها" },
  opportunities: { title: "الفرص", color: "text-sky-700", bg: "bg-sky-50", rule: "استثمارها والاستفادة منها لصالح الشركة" },
  threats: { title: "المخاطر", color: "text-amber-700", bg: "bg-amber-50", rule: "تجنبه او التقليل من اثاره" },
}

export const TraditionalStrategiesTab: React.FC<TraditionalStrategiesTabProps> = ({ analysis }) => {
  const [goals, setGoals] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})

  const handleGoalChange = (key: string, value: string) => {
    setGoals((prev) => ({ ...prev, [key]: value }))
  }

  const generateGoal = async (quadrantKey: SwotQuadrantKey, item: SwotItem, key: string) => {
    setIsGenerating((prev) => ({ ...prev, [key]: true }))

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch("/api/tools/swot-goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          quadrantKey,
          itemTitle: item.title,
          itemDetail: item.detail
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.goal) {
          setGoals((prev) => ({ ...prev, [key]: data.goal }));
        }
      } else {
        throw new Error("Failed to generate from API");
      }
    } catch (e) {
      console.error("AI Generation failed, using dynamic fallback:", e);
      // Dynamic Fallback AI Mock Logic if API fails
      let generatedGoal = ""
      const title = item.title.trim()
      
      switch (quadrantKey) {
        case "strengths":
          generatedGoal = `توظيف ميزة "${title}" في تسريع النمو ورفع الكفاءة التشغيلية للحفاظ على التفوق التنافسي.`
          break
        case "weaknesses":
          generatedGoal = `إعداد خطة تنفيذية لمعالجة "${title}" وتقليص تأثيرها السلبي على الأداء العام.`
          break
        case "opportunities":
          generatedGoal = `استغلال فرصة "${title}" من خلال تخصيص الموارد اللازمة لتعظيم العوائد.`
          break
        case "threats":
          generatedGoal = `وضع تدابير وقائية للحد من خطر "${title}" لضمان استمرارية العمل دون انقطاع.`
          break
      }
      setGoals((prev) => ({ ...prev, [key]: generatedGoal }))
    } finally {
      setIsGenerating((prev) => ({ ...prev, [key]: false }))
    }
  }

  const renderQuadrant = (quadrantKey: SwotQuadrantKey, items: SwotItem[]) => {
    if (!items || items.length === 0) return null
    const config = QUADRANT_CONFIG[quadrantKey]

    return (
      <div key={quadrantKey} className="mb-6">
        <div className={`p-4 rounded-t-xl border border-b-0 ${config.bg} border-slate-200 flex flex-col gap-1.5`}>
          <h4 className={`font-bold text-lg ${config.color}`}>{config.title}</h4>
          <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
            <Target className="w-4 h-4 text-slate-500" />
            <span>
              <strong>القاعدة:</strong> كل نقطة {config.title.replace("نقاط ", "").replace("ال", "")} {config.rule} هدف.
            </span>
          </p>
        </div>
        <div className="border border-slate-200 rounded-b-xl p-4 bg-white space-y-4">
          {items.map((item, idx) => {
            const itemKey = `${quadrantKey}-${idx}`
            const currentGoal = goals[itemKey] || ""
            const loading = isGenerating[itemKey]

            return (
              <div
                key={idx}
                className="flex flex-col md:flex-row gap-4 p-4 border border-slate-200 bg-slate-50 rounded-xl items-start md:items-center transition-all hover:border-slate-300 shadow-sm hover:shadow-md"
              >
                <div className="flex-1">
                  <span className="font-semibold text-slate-800 text-sm md:text-base">{item.title}</span>
                  {item.detail && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.detail}</p>}
                </div>

                <div className="flex items-center justify-center text-slate-300 hidden md:flex px-2">
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </div>

                <div className="flex-1 w-full flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-slate-700">الهدف الاستراتيجي المستخرج:</label>
                  <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <textarea
                      value={currentGoal}
                      onChange={(e) => handleGoalChange(itemKey, e.target.value)}
                      placeholder="اكتب الهدف هنا..."
                      rows={2}
                      className="flex-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow resize-y min-h-[44px]"
                    />
                    <button
                      onClick={() => generateGoal(quadrantKey, item, itemKey)}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-bold whitespace-nowrap disabled:opacity-50 h-[44px]"
                    >
                      {loading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      توليد الهدف بالذكاء
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const hasItems =
    (analysis.strengths?.length || 0) > 0 ||
    (analysis.weaknesses?.length || 0) > 0 ||
    (analysis.opportunities?.length || 0) > 0 ||
    (analysis.threats?.length || 0) > 0

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 border rounded-2xl bg-slate-50 mt-4">
        <p>لا توجد بيانات كافية لتوليد الاستراتيجيات. يرجى إضافة بنود للتحليل أولاً.</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {renderQuadrant("strengths", analysis.strengths)}
      {renderQuadrant("weaknesses", analysis.weaknesses)}
      {renderQuadrant("opportunities", analysis.opportunities)}
      {renderQuadrant("threats", analysis.threats)}
    </div>
  )
}

