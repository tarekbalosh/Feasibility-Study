import React, { useState, useCallback } from "react";
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ClipboardList,
  Loader2,
  AlertCircle,
  X,
  BarChart2,
  TrendingUp,
  Sigma,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TaskModal, TaskFormData } from "./TaskModal";

// ——————————————————————————————————————————————
// Types
// ——————————————————————————————————————————————

export interface Task {
  id: string;
  goalId: string;
  goalIndex: number;
  taskIndex: number;
  title: string;
  dueDate: string;
  assignee: string;
  follower: string;
  weight: number;
  cost: number;
  currency: string;
  priority: "normal" | "medium" | "high";
  status: "not_started" | "in_progress" | "overdue" | "completed";
  progress: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  budgetDistribution?: {
    mode: "lump" | "monthly" | "custom";
    monthly: number[];
    lumpMonth?: number;
    startMonth?: number;
    endMonth?: number;
  };
}

interface TasksAccordionProps {
  goalId: string;
  goalIndex: number;
  goalText: string;
  tasks: Task[];
  onTasksChange: () => void;
  members: { id: string; name: string; email: string; role?: string }[];
  defaultCurrency?: string;
}

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————

const ar = (value: number): string => value.toLocaleString("ar-EG");

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    SAR: "ر.س", AED: "د.إ", USD: "$", EUR: "€", KWD: "د.ك",
    QAR: "ر.ق", BHD: "د.ب", OMR: "ر.ع", EGP: "ج.م",
  };
  return `${amount.toLocaleString("ar-EG")} ${symbols[currency] || currency}`;
};

const PRIORITY_BADGE: Record<string, { label: string; class: string }> = {
  high: { label: "عالية", class: "bg-red-50 text-red-700 ring-red-600/20" },
  medium: { label: "متوسطة", class: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  normal: { label: "عادية", class: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  completed: { label: "أُنجزت", class: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  in_progress: { label: "قيد الإنجاز", class: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  overdue: { label: "متأخرة", class: "bg-red-50 text-red-700 ring-red-600/20" },
  not_started: { label: "لم تبدأ", class: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};

// ——————————————————————————————————————————————
// Component
// ——————————————————————————————————————————————

export const TasksAccordion: React.FC<TasksAccordionProps> = ({
  goalId,
  goalIndex,
  goalText,
  tasks,
  onTasksChange,
  members,
  defaultCurrency = "SAR",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);

  
  const weightSum = tasks.reduce((s, t) => s + t.weight, 0);
  const goalProgress = tasks.length > 0
    ? Math.round(tasks.reduce((s, t) => s + t.weight * t.progress, 0) / 100)
    : 0;
  const totalCost = tasks.reduce((s, t) => s + t.cost, 0);

  const handleSaveTask = useCallback(
    async (data: TaskFormData | TaskFormData[], addAnother: boolean) => {
      try {
        if (Array.isArray(data)) {
          await Promise.all(
            data.map((d) => api.post(`/swot-tasks/${goalId}`, { ...d, goalIndex }, { skipToast: true }))
          );
          toast.success(`تم إضافة ${data.length} مهام بنجاح.`);
        } else if (editingTask) {
          await api.put(`/swot-tasks/${editingTask.id}`, data, { skipToast: true });
          toast.success("تم تعديل المهمة بنجاح.");
        } else {
          await api.post(`/swot-tasks/${goalId}`, { ...data, goalIndex }, { skipToast: true });
          toast.success("تم إضافة المهمة بنجاح.");
        }
        onTasksChange();
        if (!addAnother) {
          setShowModal(false);
          setEditingTask(null);
        }
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.response?.data?.error?.message || "تعذّر حفظ المهمة.";
        toast.error(message);
        throw err;
      }
    },
    [editingTask, goalId, goalIndex, onTasksChange]
  );

  const handleDelete = useCallback(async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await api.delete(`/swot-tasks/${deletingTask.id}`, { skipToast: true });
      toast.success("تم حذف المهمة.");
      onTasksChange();
    } catch {
      toast.error("تعذّر حذف المهمة.");
    } finally {
      setIsDeleting(false);
      setDeletingTask(null);
    }
  }, [deletingTask, onTasksChange]);

    const handleDuplicate = useCallback(async (taskId: string) => {
    try {
      await api.post(`/swot-tasks/${taskId}/duplicate`, {}, { skipToast: true });
      toast.success("تم تكرار المهمة.");
      onTasksChange();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذّر تكرار المهمة.");
    }
  }, [onTasksChange]);

  const handleQuickStatusUpdate = useCallback(async (taskId: string, status: string, progress: number) => {
    try {
      await api.patch(`/swot-tasks/${taskId}/status`, { status, progress }, { skipToast: true });
      onTasksChange();
    } catch {
      toast.error("تعذّر تحديث الحالة.");
    }
  }, [onTasksChange]);

  const currentWeightForModal = editingTask
    ? weightSum - editingTask.weight
    : weightSum;

  const nextTaskIndex = tasks.length > 0
    ? Math.max(...tasks.map((t) => t.taskIndex)) + 1
    : 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm group"
      >
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        {tasks.length > 0 ? "إدارة المهام" : "إضافة مهام"}
        {tasks.length > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
            {ar(tasks.length)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 sm:p-8 border-b border-slate-100 bg-white shrink-0 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 opacity-70 pointer-events-none" />
              
              <div className="text-right relative z-10 w-full pl-12">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200/50">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-700">
                    إدارة المهام التنفيذية للهدف:
                  </h3>
                </div>
                
                <div className="bg-gradient-to-l from-indigo-50/80 via-white to-white border border-indigo-100/60 p-4 sm:p-5 rounded-2xl shadow-sm relative">
                  <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 rounded-r-2xl" />
                  <p className="text-lg sm:text-xl leading-relaxed text-indigo-950 font-black pr-2">
                    {goalText}
                  </p>
                </div>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all self-start relative z-10 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">لا توجد مهام لهذا الهدف</h4>
                  <p className="text-sm text-slate-500 mb-6 max-w-md">قم بتقسيم هدفك الاستراتيجي إلى مهام تنفيذية صغيرة قابلة للقياس لتحقيق الهدف بنجاح.</p>
                  <button
                    type="button"
                    onClick={() => { setEditingTask(null); setShowModal(true); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#5452F6] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة أول مهمة
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Tasks Table Wrapper */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto pb-2 -mx-1 px-1">
                      <table className="w-full text-right border-separate border-spacing-y-1.5 min-w-[900px]">
                        <thead>
                          <tr>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-16">رقم</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">عنوان المهمة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-16">الوزن</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">المسؤول</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">المتابعة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">تاريخ الإنجاز</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-16">الأهمية</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-20">الحالة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-28">الإنجاز</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">التكلفة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => {
                            const pBadge = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.normal;
                            const sBadge = STATUS_BADGE[task.status] || STATUS_BADGE.not_started;

                            return (
                              <tr key={task.id} className="group bg-white hover:bg-blue-50/30 shadow-[0_1px_4px_-2px_rgba(0,0,0,0.06)] hover:shadow-md ring-1 ring-slate-200/50 hover:ring-indigo-200 transition-all duration-200">
                                <td className="px-3 py-3 text-center rounded-r-xl">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 text-slate-500 text-[11px] font-bold ring-1 ring-slate-200/50">
                                    {ar(task.goalIndex)}.{ar(task.taskIndex)}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="text-[13px] font-semibold text-slate-800 leading-relaxed">{task.title}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-[12px] font-bold text-indigo-600">{ar(task.weight)}%</span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="text-[12px] text-slate-600 font-medium">{task.assignee}</span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="text-[12px] text-slate-500">{task.follower}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-[12px] text-slate-600 font-medium whitespace-nowrap">
                                    {new Date(task.dueDate).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset whitespace-nowrap", pBadge.class)}>
                                    {pBadge.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextMap: Record<string, { status: string; progress: number }> = {
                                        not_started: { status: "in_progress", progress: task.progress || 10 },
                                        in_progress: { status: "completed", progress: 100 },
                                        overdue: { status: "completed", progress: 100 },
                                        completed: { status: "not_started", progress: 0 },
                                      };
                                      const next = nextMap[task.status] || nextMap.not_started;
                                      handleQuickStatusUpdate(task.id, next.status, next.progress);
                                    }}
                                    className="group/status"
                                    title="انقر للتبديل"
                                  >
                                    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity", sBadge.class)}>
                                      {sBadge.label}
                                    </span>
                                  </button>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={clsx("h-full rounded-full transition-all duration-500", task.progress >= 100 ? "bg-emerald-500" : task.progress > 50 ? "bg-blue-500" : task.progress > 0 ? "bg-amber-500" : "bg-slate-300")}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 min-w-[28px]">{ar(task.progress)}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-[12px] text-slate-600 font-medium whitespace-nowrap">
                                      {formatCurrency(task.cost, task.currency)}
                                    </span>
                                    {task.budgetDistribution && task.cost > 0 && (
                                      <div className="flex gap-0.5 items-end h-3" title="تم توزيع الميزانية على الأشهر">
                                        {task.budgetDistribution.monthly.map((v, i) => {
                                          const maxVal = Math.max(...task.budgetDistribution!.monthly);
                                          const pct = maxVal > 0 ? Math.round((v / maxVal) * 100) : 0;
                                          return (
                                            <div
                                              key={i}
                                              className={clsx(
                                                "w-[3px] rounded-sm transition-all",
                                                pct > 0 ? "bg-violet-500" : "bg-slate-200"
                                              )}
                                              style={{ height: `${Math.max(pct * 0.12, pct > 0 ? 2 : 1)}px` }}
                                            />
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center rounded-l-xl">
                                  <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => { setEditingTask(task); setShowModal(true); }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                      title="تعديل"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicate(task.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="تكرار"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingTask(task)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>

                        {/* Summary row */}
                        <tfoot>
                          <tr className="bg-gradient-to-l from-indigo-50/80 to-white border-t-2 border-indigo-100/50 shadow-[0_-2px_10px_-4px_rgba(99,102,241,0.15)] relative z-10">
                            <td colSpan={2} className="px-3 py-4 rounded-r-xl">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                  <Sigma className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[13px] font-black text-indigo-900 tracking-wide">الإجمالي الكلي</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className={clsx("text-[13px] font-black px-2 py-1 rounded-md", weightSum === 100 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                                {ar(weightSum)}%
                              </span>
                            </td>
                            <td colSpan={5} className="px-3 py-4" />
                            <td className="px-3 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-16 h-2 bg-indigo-100/50 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className={clsx("h-full rounded-full transition-all duration-700", goalProgress >= 100 ? "bg-emerald-500" : goalProgress > 50 ? "bg-indigo-500" : "bg-indigo-400")}
                                    style={{ width: `${goalProgress}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-indigo-700">{ar(goalProgress)}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center relative group/total">
                              <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-100/60 ring-1 ring-indigo-200/50 shadow-sm transition-all hover:bg-indigo-100 hover:ring-indigo-300 hover:scale-105 cursor-default">
                                <span className="text-[13px] font-black text-indigo-800 tracking-tight">{formatCurrency(totalCost, tasks[0]?.currency || defaultCurrency)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 rounded-l-xl" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* ── Budget Distribution Breakdown Panel ── */}
                  {tasks.some(t => t.cost > 0) && (
                    <div className="border border-violet-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      {/* Header */}
                      <button
                        type="button"
                        onClick={() => setShowBudgetBreakdown(p => !p)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-l from-violet-50 to-white hover:from-violet-100 transition-all"
                      >
                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                          <BarChart2 className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-violet-800">توزيع الميزانية الشهري للمهام</span>
                          <p className="text-[11px] text-slate-500">
                            {tasks.filter(t => t.cost > 0).length} مهمة لها تكلفة مالية
                          </p>
                        </div>
                        <ChevronDown
                          className={clsx("w-4 h-4 text-violet-500 mr-auto transition-transform duration-200", showBudgetBreakdown && "rotate-180")}
                        />
                      </button>

                      {showBudgetBreakdown && (
                        <div className="p-4 space-y-5 border-t border-violet-100">

                          {/* التوزيع الإجمالي لكل الأشهر */}
                          {(() => {
                            const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
                            const tasksWithDist = tasks.filter(t => t.budgetDistribution && t.cost > 0);
                            const totalByMonth = Array(12).fill(0).map((_, i) =>
                              tasksWithDist.reduce((sum, t) => sum + (t.budgetDistribution?.monthly[i] ?? 0), 0)
                            );
                            const maxMonthVal = Math.max(...totalByMonth);
                            const currency = tasks[0]?.currency || defaultCurrency;

                            return (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                                  <span className="text-xs font-bold text-slate-600">الإنفاق الشهري الإجمالي (للمهام ذات التوزيع)</span>
                                </div>
                                <div className="grid grid-cols-12 gap-1 items-end h-20">
                                  {totalByMonth.map((val, i) => {
                                    const pct = maxMonthVal > 0 ? (val / maxMonthVal) * 100 : 0;
                                    return (
                                      <div key={i} className="flex flex-col items-center gap-1 group/totalbar relative">
                                        <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                                          <div
                                            className={clsx(
                                              "w-full rounded-t-md transition-all duration-500 cursor-pointer",
                                              pct > 0 ? "bg-gradient-to-t from-violet-600 to-violet-400 hover:opacity-80" : "bg-slate-100"
                                            )}
                                            style={{ height: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                                          />
                                        </div>
                                        {/* Premium Tooltip */}
                                        {pct > 0 && (
                                          <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-20 hidden group-hover/totalbar:flex flex-col items-center pointer-events-none opacity-0 group-hover/totalbar:opacity-100 transition-opacity duration-200">
                                            <div className="bg-slate-900/95 backdrop-blur-md shadow-xl border border-white/10 text-white px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
                                              <span className="text-[10px] text-slate-300 font-medium">{monthNames[i]}</span>
                                              <div className="w-px h-3 bg-white/20" />
                                              <span className="text-xs font-black">{formatCurrency(val, currency)}</span>
                                            </div>
                                            <div className="w-2.5 h-2.5 bg-slate-900/95 border-r border-b border-white/10 rotate-45 -mt-1.5" />
                                          </div>
                                        )}
                                        <span className="text-[10px] font-bold text-slate-400 leading-none truncate w-full text-center" title={monthNames[i]}>{monthNames[i]}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                                  <span>الإجمالي المُوزّع: <span className="text-violet-700 font-bold">{formatCurrency(totalByMonth.reduce((a,b)=>a+b,0), currency)}</span></span>
                                  <span>أعلى شهر: <span className="font-bold text-slate-600">{formatCurrency(maxMonthVal, currency)}</span></span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* توزيع كل مهمة منفردة */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs font-bold text-slate-600">تفصيل التوزيع لكل مهمة</span>
                            </div>
                            {tasks.filter(t => t.cost > 0).map(task => {
                              const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
                              const hasDist = !!task.budgetDistribution;
                              const dist = task.budgetDistribution;
                              const maxVal = hasDist ? Math.max(...dist!.monthly) : 0;
                              const modeLabel = !hasDist ? "غير مُحدد" : dist!.mode === "lump" ? "دفعة واحدة" : dist!.mode === "monthly" ? "شهري" : "مخصص";
                              const activeMonths = hasDist ? dist!.monthly.filter(v => v > 0).length : 0;

                              return (
                                <div key={task.id} className={clsx("rounded-xl border p-3", hasDist ? "bg-slate-50 border-slate-200" : "bg-amber-50/50 border-amber-200")}>
                                  {/* Task Header */}
                                  <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className={clsx("inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold", hasDist ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700")}>
                                        {task.goalIndex}.{task.taskIndex}
                                      </span>
                                      <span className="text-[12px] font-bold text-slate-800">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", hasDist ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700")}>{modeLabel}</span>
                                      {hasDist && <span className="text-[10px] text-slate-500 font-medium">{activeMonths} شهر</span>}
                                      <span className="text-[11px] font-bold text-slate-700">{formatCurrency(task.cost, task.currency)}</span>
                                    </div>
                                  </div>

                                  {hasDist ? (
                                    <>
                                      {/* Mini bar chart per task */}
                                      <div className="grid grid-cols-12 gap-0.5 items-end" style={{ height: "36px" }}>
                                        {dist!.monthly.map((val, i) => {
                                          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                                          return (
                                            <div key={i} className="relative flex flex-col items-center group/bar">
                                              <div
                                                className={clsx(
                                                  "w-full rounded-t-sm transition-all",
                                                  pct > 0 ? "bg-violet-500 hover:bg-violet-600" : "bg-slate-200"
                                                )}
                                                style={{ height: `${Math.max(pct * 0.36, pct > 0 ? 3 : 1)}px` }}
                                              />
                                              {/* Tooltip */}
                                              {pct > 0 && (
                                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 hidden group-hover/bar:flex flex-col items-center pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200">
                                                  <div className="bg-slate-900/95 backdrop-blur-md shadow-xl border border-white/10 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap">
                                                    <span className="text-[9px] text-slate-300 font-medium">{monthNames[i]}</span>
                                                    <div className="w-px h-2.5 bg-white/20" />
                                                    <span className="text-[11px] font-black">{formatCurrency(val, task.currency)}</span>
                                                  </div>
                                                  <div className="w-2 h-2 bg-slate-900/95 border-r border-b border-white/10 rotate-45 -mt-1" />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Month labels */}
                                      <div className="grid grid-cols-12 gap-0.5 mt-1">
                                        {monthNames.map((m, i) => (
                                          <div key={i} className="text-center overflow-hidden">
                                            <span className={clsx(
                                              "text-[9px] font-bold truncate block w-full",
                                              dist!.monthly[i] > 0 ? "text-violet-600" : "text-slate-300"
                                            )} title={m}>{m}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200">
                                      <span className="text-[11px] text-amber-700 font-medium">هذه المهمة ليس لها توزيع شهري حتى الآن.</span>
                                      <button 
                                        type="button" 
                                        onClick={() => { setEditingTask(task); setShowModal(true); }}
                                        className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md transition-colors"
                                      >
                                        تعديل لإضافة التوزيع
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {/* Weight indicator */}
                    {weightSum !== 100 ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        مجموع الأوزان: {ar(weightSum)}% — متبقٍّ {ar(100 - weightSum)}% لإكمال 100%.
                      </div>
                    ) : (
                      <div />
                    )}

                    {weightSum < 100 && (
                      <button
                        type="button"
                        onClick={() => { setEditingTask(null); setShowModal(true); }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5452F6] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة مهمة جديدة
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
               <button onClick={() => setIsOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-colors">
                 إغلاق النافذة
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <TaskModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          currentWeightSum={currentWeightForModal}
          initialData={editingTask || undefined}
          members={members}
          goalText={goalText}
          defaultCurrency={defaultCurrency}
          taskIndex={editingTask ? editingTask.taskIndex : nextTaskIndex}
          goalIndex={goalIndex}
        />
      )}

      <ConfirmDialog
        open={!!deletingTask}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        title="حذف المهمة"
        message="هل أنت متأكد من رغبتك في حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف المهمة"
        tone="destructive"
      />
    </>
  );
};

export default TasksAccordion;
