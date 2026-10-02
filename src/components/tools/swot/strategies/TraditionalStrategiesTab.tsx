import React, { useState } from "react";
import clsx from "clsx";
import { Sparkles, Edit2, Check, Plus, Trash2, X } from "lucide-react";
import type { SwotAnalysis, SwotQuadrantKey, SwotItem } from "@/types/swot";

interface TraditionalStrategiesTabProps {
  analysis: SwotAnalysis;
  goals: Record<string, { text: string; isAi: boolean }[]>;
  setGoals: React.Dispatch<React.SetStateAction<Record<string, { text: string; isAi: boolean }[]>>>;
}

const ar = (value: number): string => value.toLocaleString("ar-EG");

const TRADITIONAL_GROUPS = [
  { key: "strengths", title: "نقاط القوة", formula: "كل نقطة قوة الحفاظ عليها أو تعزيزها هدف", accent: "bg-emerald-50/30 border-emerald-200 text-emerald-900", btnColor: "text-emerald-700 bg-emerald-100 hover:bg-emerald-200" },
  { key: "weaknesses", title: "نقاط الضعف", formula: "كل نقطة ضعف علاجها أو التخلص منها هدف", accent: "bg-rose-50/30 border-rose-200 text-rose-900", btnColor: "text-rose-700 bg-rose-100 hover:bg-rose-200" },
  { key: "opportunities", title: "الفرص", formula: "كل فرصة استثمارها والاستفادة منها هدف", accent: "bg-sky-50/30 border-sky-200 text-sky-900", btnColor: "text-sky-700 bg-sky-100 hover:bg-sky-200" },
  { key: "threats", title: "المخاطر", formula: "كل خطر تجنبه أو التقليل من آثاره هدف", accent: "bg-amber-50/30 border-amber-200 text-amber-900", btnColor: "text-amber-700 bg-amber-100 hover:bg-amber-200" },
];

export const TraditionalStrategiesTab: React.FC<TraditionalStrategiesTabProps> = ({ analysis, goals, setGoals }) => {
  const [editingIndex, setEditingIndex] = useState<{ key: string; index: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

  const handleEditClick = (key: string, index: number, value: string) => {
    setEditingIndex({ key, index });
    setEditingValue(value);
    setAddingKey(null);
  };

  const handleSaveEdit = (key: string, index: number) => {
    if (editingValue.trim()) {
      setGoals((prev) => {
        const newGroup = [...(prev[key] || [])];
        newGroup[index] = { ...newGroup[index], text: editingValue.trim() };
        return { ...prev, [key]: newGroup };
      });
    }
    setEditingIndex(null);
  };

  const handleDelete = (key: string, index: number) => {
    setGoals((prev) => {
      const newGroup = (prev[key] || []).filter((_, i) => i !== index);
      return { ...prev, [key]: newGroup };
    });
  };

  const handleAddClick = (key: string) => {
    setAddingKey(key);
    setNewValue("");
    setEditingIndex(null);
  };

  const handleSaveNew = (key: string) => {
    if (newValue.trim()) {
      setGoals((prev) => {
        return { ...prev, [key]: [...(prev[key] || []), { text: newValue.trim(), isAi: false }] };
      });
    }
    setAddingKey(null);
  };

  const generateGoal = async (quadrantKey: SwotQuadrantKey, item: SwotItem, key: string) => {
    setIsGenerating((prev) => ({ ...prev, [key]: true }));

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
          setGoals((prev) => ({ ...prev, [key]: [...(prev[key] || []), { text: data.goal, isAi: true }] }));
        }
      } else {
        throw new Error("Failed to generate from API");
      }
    } catch (e) {
      console.error("AI Generation failed, using dynamic fallback:", e);
      let generatedGoal = "";
      const title = item.title.trim();
      switch (quadrantKey) {
        case "strengths":
          generatedGoal = `توظيف ميزة "${title}" في تسريع النمو ورفع الكفاءة التشغيلية للحفاظ على التفوق التنافسي.`;
          break;
        case "weaknesses":
          generatedGoal = `إعداد خطة تنفيذية لمعالجة "${title}" وتقليص تأثيرها السلبي على الأداء العام.`;
          break;
        case "opportunities":
          generatedGoal = `استغلال فرصة "${title}" من خلال تخصيص الموارد اللازمة لتعظيم العوائد.`;
          break;
        case "threats":
          generatedGoal = `وضع تدابير وقائية للحد من خطر "${title}" لضمان استمرارية العمل دون انقطاع.`;
          break;
      }
      setGoals((prev) => ({ ...prev, [key]: [...(prev[key] || []), { text: generatedGoal, isAi: true }] }));
    } finally {
      setIsGenerating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const hasItems =
    (analysis.strengths?.length || 0) > 0 ||
    (analysis.weaknesses?.length || 0) > 0 ||
    (analysis.opportunities?.length || 0) > 0 ||
    (analysis.threats?.length || 0) > 0;

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 border rounded-2xl bg-slate-50 mt-4">
        <p>لا توجد بيانات كافية لتوليد الاستراتيجيات. يرجى إضافة بنود للتحليل أولاً.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {TRADITIONAL_GROUPS.map((group) => {
        const quadrantKey = group.key as SwotQuadrantKey;
        const items = analysis[quadrantKey] || [];
        if (items.length === 0) return null;

        return (
          <div
            key={group.key}
            className={clsx(
              "border rounded-xl p-5 flex flex-col gap-4",
              group.accent
            )}
          >
            <div className="flex flex-col gap-1.5 shrink-0">
              <h4 className="text-lg font-bold">{group.title}</h4>
              <span className="text-xs font-semibold opacity-70">
                القاعدة: {group.formula}
              </span>
            </div>

            <div className="flex flex-col gap-4 mt-2 overflow-y-auto max-h-[24rem] pr-1.5 -mr-1.5 relative">
              {items.map((item, idx) => {
                const itemKey = `${quadrantKey}-${idx}`;
                const itemGoals = goals[itemKey] || [];
                const loading = isGenerating[itemKey];

                return (
                  <div key={idx} className="flex flex-col gap-3 p-4 bg-white/60 rounded-xl border border-white shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-[13px] text-slate-800 leading-snug">
                          {ar(idx + 1)}. {item.title}
                        </h5>
                        {item.detail && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.detail}</p>}
                      </div>
                      
                      <button
                        onClick={() => generateGoal(quadrantKey, item, itemKey)}
                        disabled={loading}
                        className={clsx(
                          "shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50",
                          group.btnColor
                        )}
                        title="توليد هدف ذكي لهذه النقطة"
                      >
                        {loading ? (
                          <span className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        توليد
                      </button>
                    </div>

                    {/* Goals List */}
                    {itemGoals.length > 0 && (
                      <ul className="flex flex-col gap-2 mt-1">
                        {itemGoals.map((goal, goalIdx) => {
                          const isEditing = editingIndex?.key === itemKey && editingIndex?.index === goalIdx;
                          return (
                            <li key={goalIdx} className="flex flex-col gap-2 p-2.5 rounded-lg bg-white/80 border border-slate-100 hover:bg-white hover:border-slate-200 transition-colors">
                              {isEditing ? (
                                <div className="flex-1 flex flex-col gap-2 w-full">
                                  <textarea
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-full text-sm p-2 border border-sky-300 rounded-md focus:ring-2 focus:ring-sky-500 outline-none resize-none bg-white"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => setEditingIndex(null)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                    <button onClick={() => handleSaveEdit(itemKey, goalIdx)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 group/item">
                                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-40 bg-current" />
                                  <div className="flex-1 text-xs text-slate-700 leading-relaxed">
                                    {goal.text}
                                    {goal.isAi && (
                                      <span className="inline-flex items-center gap-1 mx-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        <Sparkles className="w-2.5 h-2.5" /> توليد ذكاء
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => handleEditClick(itemKey, goalIdx, goal.text)} className="p-1 text-sky-600 hover:bg-sky-50 rounded-md transition-colors" title="تعديل"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(itemKey, goalIdx)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {addingKey === itemKey ? (
                      <div className="flex flex-col gap-2 mt-1 p-2 bg-white/60 rounded-lg border border-sky-200 border-dashed">
                        <textarea
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          placeholder="اكتب الهدف هنا..."
                          className="w-full text-sm p-2 border border-sky-300 rounded-md focus:ring-2 focus:ring-sky-500 outline-none resize-none bg-white"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setAddingKey(null)} className="p-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                          <button onClick={() => handleSaveNew(itemKey)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"><Check className="w-3.5 h-3.5" /> حفظ</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddClick(itemKey)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 mt-1 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-white/80 transition-all text-[11px] font-semibold"
                      >
                        <Plus className="w-3 h-3" /> إضافة هدف يدوي
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
