import React, { useState, useEffect } from "react";
import { Plus, Save, Trash2, Pencil, Check, X, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import type { SwotAnalysis, SwotItem, SwotQuadrantKey } from "@/types/swot";
import {
  listSwotGoals,
  createSwotGoal,
  updateSwotGoal,
  deleteSwotGoal,
  type SwotCustomGoal,
  type SaveSwotCustomGoalPayload
} from "@/services/swotGoals.service";

interface CustomGoalsTabProps {
  analysis: SwotAnalysis;
}

interface GoalFormState {
  goalText: string;
  linkedStrengths: string[];
  linkedWeaknesses: string[];
  linkedOpportunities: string[];
  linkedThreats: string[];
}

const emptyForm: GoalFormState = {
  goalText: "",
  linkedStrengths: [],
  linkedWeaknesses: [],
  linkedOpportunities: [],
  linkedThreats: []
};

const QUADRANT_LABELS: Record<SwotQuadrantKey, string> = {
  strengths: "استخدم نقاط قوة",
  weaknesses: "عالج نقاط ضعف",
  opportunities: "استغل فرصاً",
  threats: "تجنّب/واجه مخاطر"
};

const QUADRANT_COLORS: Record<SwotQuadrantKey, string> = {
  strengths: "bg-green-100 text-green-800 border-green-200",
  weaknesses: "bg-red-100 text-red-800 border-red-200",
  opportunities: "bg-sky-100 text-sky-800 border-sky-200",
  threats: "bg-amber-100 text-amber-800 border-amber-200"
};

export const CustomGoalsTab: React.FC<CustomGoalsTabProps> = ({ analysis }) => {
  const [goals, setGoals] = useState<SwotCustomGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GoalFormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, [analysis.id]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const fetched = await listSwotGoals(analysis.id);
      setGoals(fetched);
    } catch (error) {
      toast.error("تعذر تحميل الأهداف المخصصة.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.goalText.trim()) {
      toast.error("يرجى إدخال نص الهدف.");
      return;
    }

    try {
      const payload: SaveSwotCustomGoalPayload = {
        goalText: formData.goalText,
        linkedStrengths: formData.linkedStrengths,
        linkedWeaknesses: formData.linkedWeaknesses,
        linkedOpportunities: formData.linkedOpportunities,
        linkedThreats: formData.linkedThreats,
      };

      if (editingId) {
        await updateSwotGoal(editingId, payload);
        toast.success("تم تحديث الهدف بنجاح.");
      } else {
        await createSwotGoal(analysis.id, payload);
        toast.success("تمت إضافة الهدف بنجاح.");
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchGoals();
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الهدف.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSwotGoal(confirmDelete);
      toast.success("تم حذف الهدف.");
      await fetchGoals();
    } catch (error) {
      toast.error("تعذر حذف الهدف.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleItemSelection = (quadrant: SwotQuadrantKey, title: string) => {
    const key = `linked${quadrant.charAt(0).toUpperCase() + quadrant.slice(1)}` as keyof GoalFormState;
    const currentList = formData[key] as string[];
    
    if (currentList.includes(title)) {
      setFormData({ ...formData, [key]: currentList.filter(t => t !== title) });
    } else {
      setFormData({ ...formData, [key]: [...currentList, title] });
    }
  };

  const startEdit = (goal: SwotCustomGoal) => {
    setEditingId(goal.id);
    setIsAdding(true);
    setFormData({
      goalText: goal.goalText,
      linkedStrengths: goal.linkedStrengths,
      linkedWeaknesses: goal.linkedWeaknesses,
      linkedOpportunities: goal.linkedOpportunities,
      linkedThreats: goal.linkedThreats,
    });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const renderSelectionList = (quadrant: SwotQuadrantKey, items?: SwotItem[]) => {
    if (!items || items.length === 0) return null;
    const key = `linked${quadrant.charAt(0).toUpperCase() + quadrant.slice(1)}` as keyof GoalFormState;
    const selectedList = formData[key] as string[];

    return (
      <div className="flex flex-col gap-2 mt-4">
        <span className="text-sm font-bold text-slate-700">{QUADRANT_LABELS[quadrant]}</span>
        <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
          {items.map((item, idx) => (
            <label key={idx} className="flex items-start gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded transition-colors">
              <input 
                type="checkbox" 
                className="mt-1"
                checked={selectedList.includes(item.title)}
                onChange={() => toggleItemSelection(quadrant, item.title)}
              />
              <span className="text-sm text-slate-800">{item.title}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* List of existing goals */}
      {!loading && goals.map((goal) => (
        <div key={goal.id} className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-lg font-bold text-slate-900">{goal.goalText}</h4>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => startEdit(goal)} className="p-2 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setConfirmDelete(goal.id)} className="p-2 text-red-400 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {goal.linkedStrengths.map((t, i) => (
              <span key={`s-${i}`} className={`text-xs font-medium px-2 py-1 rounded border ${QUADRANT_COLORS.strengths}`}>{t}</span>
            ))}
            {goal.linkedWeaknesses.map((t, i) => (
              <span key={`w-${i}`} className={`text-xs font-medium px-2 py-1 rounded border ${QUADRANT_COLORS.weaknesses}`}>{t}</span>
            ))}
            {goal.linkedOpportunities.map((t, i) => (
              <span key={`o-${i}`} className={`text-xs font-medium px-2 py-1 rounded border ${QUADRANT_COLORS.opportunities}`}>{t}</span>
            ))}
            {goal.linkedThreats.map((t, i) => (
              <span key={`t-${i}`} className={`text-xs font-medium px-2 py-1 rounded border ${QUADRANT_COLORS.threats}`}>{t}</span>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {!loading && goals.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
          <p className="mb-4">لم تقم بوضع أي أهداف مخصصة بعد.</p>
          <Button onClick={() => setIsAdding(true)} variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة هدف جديد
          </Button>
        </div>
      )}

      {/* Add Button if there are existing goals and not currently adding */}
      {!loading && goals.length > 0 && !isAdding && (
        <Button onClick={() => setIsAdding(true)} variant="ghost" className="self-start gap-2 border border-slate-200 bg-white">
          <Plus className="w-4 h-4" />
          إضافة هدف جديد
        </Button>
      )}

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="border-2 border-sky-200 rounded-xl bg-sky-50/30 p-5 mt-2 flex flex-col gap-4">
          <h4 className="font-bold text-slate-800">{editingId ? "تعديل الهدف" : "هدف استراتيجي جديد"}</h4>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">ما هو هدفك الاستراتيجي؟</label>
            <Input 
              value={formData.goalText}
              onChange={(e) => setFormData({ ...formData, goalText: e.target.value })}
              placeholder="مثال: زيادة قاعدة العملاء بنسبة 30% خلال 6 أشهر"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {renderSelectionList("strengths", analysis.strengths)}
            {renderSelectionList("weaknesses", analysis.weaknesses)}
            {renderSelectionList("opportunities", analysis.opportunities)}
            {renderSelectionList("threats", analysis.threats)}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-sky-100">
            <Button onClick={cancelEdit} variant="ghost" className="bg-white border-slate-200 text-slate-600">
              إلغاء
            </Button>
            <Button onClick={handleSave} variant="primary" className="gap-2 bg-sky-600 hover:bg-sky-700">
              <Save className="w-4 h-4" />
              حفظ الهدف
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="حذف الهدف"
        message="هل أنت متأكد من رغبتك في حذف هذا الهدف؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
