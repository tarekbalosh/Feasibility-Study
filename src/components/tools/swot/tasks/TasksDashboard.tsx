import React, { useMemo, useState } from "react";
import {
  Target,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Filter,
  X,
  User,
  Eye,
  CheckCircle2,
  AlertOctagon,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import type { Task } from "./TasksAccordion";
import { FilterSelect, DateRangeFilter, ClearFilters } from "@/components/ui/filters";

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
          <ClearFilters hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* هدف */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الهدف</label>
              <FilterSelect
                label="الهدف"
                icon={Target}
                isAllOptionLabel="جميع الأهداف"
                value={filters.goalIndex !== undefined ? String(filters.goalIndex) : ""}
                onChange={(val) => onFiltersChange({ ...filters, goalIndex: val ? Number(val) : undefined })}
                options={goalIndices.map((i) => ({
                  value: String(i),
                  label: `الهدف ${ar(i)}`,
                }))}
              />
            </div>

            {/* المسؤول */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">المسؤول</label>
              <FilterSelect
                label="المسؤول"
                icon={User}
                isAllOptionLabel="كل المسؤولين"
                value={filters.assignee || ""}
                onChange={(val) => onFiltersChange({ ...filters, assignee: val ? String(val) : undefined })}
                options={members.map((m) => ({
                  value: m.name,
                  label: m.name,
                  initials: m.name.slice(0, 2),
                }))}
                searchThreshold={5}
              />
            </div>

            {/* المعني بالمتابعة */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">المعني بالمتابعة</label>
              <FilterSelect
                label="المعني بالمتابعة"
                icon={Eye}
                isAllOptionLabel="كل المتابعين"
                value={filters.follower || ""}
                onChange={(val) => onFiltersChange({ ...filters, follower: val ? String(val) : undefined })}
                options={members.map((m) => ({
                  value: m.name,
                  label: m.name,
                  initials: m.name.slice(0, 2),
                }))}
                searchThreshold={5}
              />
            </div>

            {/* الحالة */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الحالة</label>
              <FilterSelect
                label="الحالة"
                icon={CheckCircle2}
                isAllOptionLabel="كل الحالات"
                value={filters.status || ""}
                onChange={(val) => onFiltersChange({ ...filters, status: val ? String(val) : undefined })}
                options={[
                  { value: "not_started", label: "لم تبدأ", dotColor: "#94A3B8" },
                  { value: "in_progress", label: "قيد الإنجاز", dotColor: "#3B82F6" },
                  { value: "overdue", label: "متأخرة", dotColor: "#EF4444" },
                  { value: "completed", label: "أُنجزت", dotColor: "#10B981" },
                ]}
              />
            </div>

            {/* الأهمية */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الأهمية</label>
              <FilterSelect
                label="الأهمية"
                icon={AlertOctagon}
                isAllOptionLabel="كل الأولويات"
                value={filters.priority || ""}
                onChange={(val) => onFiltersChange({ ...filters, priority: val ? String(val) : undefined })}
                options={[
                  { value: "high", label: "عالية", dotColor: "#EF4444" },
                  { value: "medium", label: "متوسطة", dotColor: "#F59E0B" },
                  { value: "normal", label: "عادية", dotColor: "#6B7280" },
                ]}
              />
            </div>

            {/* نطاق التاريخ */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ الاستحقاق</label>
              <DateRangeFilter
                label="تاريخ الاستحقاق"
                value={{
                  from: filters.dueDateFrom,
                  to: filters.dueDateTo,
                }}
                onChange={(range) => onFiltersChange({
                  ...filters,
                  dueDateFrom: range?.from,
                  dueDateTo: range?.to,
                })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksDashboard;
