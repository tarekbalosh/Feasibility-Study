import React, { useState } from "react";
import clsx from "clsx";
import { STRATEGY_GROUPS } from "../report/reportMeta";
import type { SwotAnalysis, SwotStrategyKey } from "@/types/swot";
import { Edit2, Check, Plus, Trash2, X } from "lucide-react";

interface IntersectionStrategiesTabProps {
  analysis: SwotAnalysis;
}

const ar = (value: number): string => value.toLocaleString("ar-EG");

export const IntersectionStrategiesTab: React.FC<IntersectionStrategiesTabProps> = ({ analysis }) => {
  const [strategies, setStrategies] = useState<Record<SwotStrategyKey, string[]>>({
    so: analysis.strategies?.so || [],
    wo: analysis.strategies?.wo || [],
    st: analysis.strategies?.st || [],
    wt: analysis.strategies?.wt || [],
  });

  const [editingIndex, setEditingIndex] = useState<{ group: SwotStrategyKey; index: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [addingGroup, setAddingGroup] = useState<SwotStrategyKey | null>(null);
  const [newValue, setNewValue] = useState("");

  const handleEditClick = (group: SwotStrategyKey, index: number, value: string) => {
    setEditingIndex({ group, index });
    setEditingValue(value);
    setAddingGroup(null);
  };

  const handleSaveEdit = (group: SwotStrategyKey, index: number) => {
    if (editingValue.trim()) {
      setStrategies((prev) => {
        const newGroup = [...prev[group]];
        newGroup[index] = editingValue.trim();
        return { ...prev, [group]: newGroup };
      });
    }
    setEditingIndex(null);
  };

  const handleDelete = (group: SwotStrategyKey, index: number) => {
    setStrategies((prev) => {
      const newGroup = prev[group].filter((_, i) => i !== index);
      return { ...prev, [group]: newGroup };
    });
  };

  const handleAddClick = (group: SwotStrategyKey) => {
    setAddingGroup(group);
    setNewValue("");
    setEditingIndex(null);
  };

  const handleSaveNew = (group: SwotStrategyKey) => {
    if (newValue.trim()) {
      setStrategies((prev) => {
        return { ...prev, [group]: [...prev[group], newValue.trim()] };
      });
    }
    setAddingGroup(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {STRATEGY_GROUPS.map((group) => {
        const groupKey = group.key as SwotStrategyKey;
        const groupStrategies = strategies[groupKey] || [];
        
        return (
          <div
            key={group.key}
            className={clsx(
              "border rounded-xl p-5 flex flex-col gap-4",
              group.accent
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold">{group.title}</h4>
              <span className="text-xs font-semibold opacity-70 bg-white/70 rounded-full px-2.5 py-0.5">
                {group.formula}
              </span>
            </div>
            
            <ul className="flex flex-col gap-3">
              {groupStrategies.map((strategy, index) => {
                const isEditing = editingIndex?.group === groupKey && editingIndex?.index === index;
                
                return (
                  <li
                    key={index}
                    className="flex flex-col gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 group/item">
                      <span className="font-bold opacity-60 shrink-0 mt-0.5 text-sm">
                        {ar(index + 1)}.
                      </span>
                      
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2 w-full">
                          <textarea
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-full text-sm p-2 border border-sky-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none bg-white"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                              title="إلغاء"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSaveEdit(groupKey, index)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                              title="حفظ"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 text-sm text-slate-700 leading-relaxed">
                            {strategy}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(groupKey, index, strategy)}
                              className="p-1 text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(groupKey, index)}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            
            {addingGroup === groupKey ? (
              <div className="flex flex-col gap-2 mt-2 p-3 bg-white/60 rounded-lg border border-sky-200 border-dashed">
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="اكتب الاستراتيجية الجديدة هنا..."
                  className="w-full text-sm p-2 border border-sky-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none bg-white"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setAddingGroup(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    title="إلغاء"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSaveNew(groupKey)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> حفظ
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleAddClick(groupKey)}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-white/50 transition-all text-xs font-semibold"
              >
                <Plus className="w-4 h-4" /> إضافة استراتيجية جديدة
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
