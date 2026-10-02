import React, { useMemo, useState } from "react";
import {
  Target,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Filter,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { Task } from "./TasksAccordion";

interface TasksDashboardProps {
  tasks: Task[];
  goalsCount: number;
  defaultCurrency?: string;
  /** فلترات مفعّلة */
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  members: { id: string; name: string; email: string }[];
}

export interface DashboardFilters {
  goalIndex?: number;
  assignee?: string;
  follower?: string;
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

const ar = (value: number): string => value.toLocaleString("ar-EG");

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    SAR: "ر.س", AED: "د.إ", USD: "$", EUR: "€", KWD: "د.ك",
    QAR: "ر.ق", BHD: "د.ب", OMR: "ر.ع", EGP: "ج.م",
  };
  return `${amount.toLocaleString("ar-EG")} ${symbols[currency] || currency}`;
};

export const TasksDashboard: React.FC<TasksDashboardProps> = ({
  tasks,
  goalsCount,
  defaultCurrency = "SAR",
  filters,
  onFiltersChange,
  members,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
    const avgProgress = tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
      : 0;
    const totalBudget = tasks.reduce((s, t) => s + t.cost, 0);
    return { overdueTasks, avgProgress, totalBudget };
  }, [tasks]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const goalIndices = useMemo(() => {
    const set = new Set(tasks.map((t) => t.goalIndex));
    return Array.from(set).sort((a, b) => a - b);
  }, [tasks]);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const CARDS = [
    { label: "إجمالي الأهداف", value: ar(goalsCount), icon: Target, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-500/10" },
    { label: "إجمالي المهام", value: ar(tasks.length), icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-500/10" },
    { label: "المهام المتأخرة", value: ar(stats.overdueTasks), icon: AlertTriangle, color: stats.overdueTasks > 0 ? "text-red-600" : "text-emerald-600", bg: stats.overdueTasks > 0 ? "bg-red-50" : "bg-emerald-50", ring: stats.overdueTasks > 0 ? "ring-red-500/10" : "ring-emerald-500/10" },
    { label: "متوسط الإنجاز", value: `${ar(stats.avgProgress)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-500/10" },
    { label: "إجمالي الموازنة", value: formatCurrency(stats.totalBudget, defaultCurrency), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-500/10" },
  ];

  if (tasks.length === 0 && goalsCount === 0) return null;

  return (
    <div className="mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <span className={clsx("p-1.5 rounded-lg ring-1", card.bg, card.ring)}>
                  <Icon className={clsx("w-4 h-4", card.color)} />
                </span>
                <span className="text-[11px] font-bold text-slate-500">{card.label}</span>
              </div>
              <span className={clsx("text-xl font-black", card.color)}>{card.value}</span>
            </div>
          );
        })}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all",
            showFilters || hasActiveFilters
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Filter className="w-4 h-4" />
          فلترة المهام
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* هدف */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الهدف</label>
              <select
                value={filters.goalIndex || ""}
                onChange={(e) => onFiltersChange({ ...filters, goalIndex: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">جميع الأهداف</option>
                {goalIndices.map((i) => (
                  <option key={i} value={i}>الهدف {ar(i)}</option>
                ))}
              </select>
            </div>

            {/* المسؤول */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">المسؤول</label>
              <select
                value={filters.assignee || ""}
                onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">الكل</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* المعني بالمتابعة */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">المعني بالمتابعة</label>
              <select
                value={filters.follower || ""}
                onChange={(e) => onFiltersChange({ ...filters, follower: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">الكل</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* الحالة */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الحالة</label>
              <select
                value={filters.status || ""}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">الكل</option>
                <option value="not_started">لم تبدأ</option>
                <option value="in_progress">قيد الإنجاز</option>
                <option value="overdue">متأخرة</option>
                <option value="completed">أُنجزت</option>
              </select>
            </div>

            {/* الأهمية */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الأهمية</label>
              <select
                value={filters.priority || ""}
                onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">الكل</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="normal">عادية</option>
              </select>
            </div>

            {/* نطاق التاريخ */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={filters.dueDateFrom || ""}
                  onChange={(e) => onFiltersChange({ ...filters, dueDateFrom: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.dueDateTo || ""}
                  onChange={(e) => onFiltersChange({ ...filters, dueDateTo: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksDashboard;
