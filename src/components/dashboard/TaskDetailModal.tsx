import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Circle,
  Timer,
  Target,
  AlertOctagon,
  Filter,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import { FilterBar } from '@/components/ui/filters';
import type { FilterItemConfig, FilterValues } from '@/components/ui/filters/types';

export interface TaskItemModal {
  id: string;
  title: string;
  dueDate: string | null;
  progress: number;
  priority: string;
  cost: number;
  currency: string;
  assignee: string;
  follower: string;
  state: 'completed' | 'inProgress' | 'notStarted' | 'overdue';
  goalText?: string;
}

export interface TaskStatusSegmentItem {
  key: 'completed' | 'inProgress' | 'notStarted' | 'overdue';
  label: string;
  count: number;
  percentage: number;
  color: string;
  tasks: TaskItemModal[];
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusTitle?: string;
  statusKey?: 'completed' | 'inProgress' | 'notStarted' | 'overdue' | 'all' | null;
  tasks?: TaskItemModal[];
  allSegments?: TaskStatusSegmentItem[];
}

const STATUS_META: Record<
  'completed' | 'inProgress' | 'notStarted' | 'overdue' | 'all',
  { icon: React.FC<any>; color: string; badgeClass: string; label: string }
> = {
  all: {
    icon: CheckCircle2,
    color: '#6366F1',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    label: 'جميع المهام',
  },
  completed: {
    icon: CheckCircle2,
    color: '#10B981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'أُنجزت',
  },
  inProgress: {
    icon: Timer,
    color: '#3B82F6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'قيد الإنجاز',
  },
  notStarted: {
    icon: Circle,
    color: '#94A3B8',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    label: 'لم تبدأ',
  },
  overdue: {
    icon: Clock,
    color: '#EF4444',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    label: 'متأخرة',
  },
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'عاجلة',
  high: 'عالية',
  medium: 'متوسطة',
  normal: 'عادية',
  low: 'منخفضة',
};

export function TaskDetailModal({
  isOpen,
  onClose,
  statusTitle,
  statusKey,
  tasks,
  allSegments,
}: TaskDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'inProgress' | 'notStarted' | 'overdue' | 'all'>(
    (statusKey as any) || 'all'
  );

  useEffect(() => {
    if (statusKey) {
      setSelectedStatus(statusKey as any);
    }
  }, [statusKey]);

  // Combine all tasks across segments or fallback tasks
  const allTasks = useMemo(() => {
    if (allSegments && allSegments.length > 0) {
      return allSegments.flatMap((s) => s.tasks);
    }
    return tasks || [];
  }, [allSegments, tasks]);

  // Tasks filtered by the selected status pill
  const statusTasks = useMemo(() => {
    if (selectedStatus === 'all') {
      return allTasks;
    }
    if (allSegments && allSegments.length > 0) {
      const seg = allSegments.find((s) => s.key === selectedStatus);
      return seg ? seg.tasks : [];
    }
    return allTasks.filter((t) => t.state === selectedStatus);
  }, [selectedStatus, allTasks, allSegments]);

  // Filter options derived from all tasks
  const assigneeOptions = useMemo(() => {
    const set = new Set<string>();
    allTasks.forEach((t) => {
      if (t.assignee && t.assignee.trim()) {
        set.add(t.assignee.trim());
      }
    });
    return Array.from(set).map((name) => ({
      value: name,
      label: name,
      initials: name.slice(0, 2),
    }));
  }, [allTasks]);

  const goalOptions = useMemo(() => {
    const set = new Set<string>();
    allTasks.forEach((t) => {
      if (t.goalText && t.goalText.trim()) {
        set.add(t.goalText.trim());
      }
    });
    return Array.from(set).map((goal) => ({
      value: goal,
      label: goal,
    }));
  }, [allTasks]);

  const priorityOptions = useMemo(
    () => [
      { value: 'urgent', label: 'عاجلة', dotColor: '#DC2626' },
      { value: 'high', label: 'عالية', dotColor: '#EF4444' },
      { value: 'medium', label: 'متوسطة', dotColor: '#F59E0B' },
      { value: 'normal', label: 'عادية', dotColor: '#6B7280' },
      { value: 'low', label: 'منخفضة', dotColor: '#94A3B8' },
    ],
    []
  );

  const filterConfigs: FilterItemConfig[] = useMemo(() => {
    const configs: FilterItemConfig[] = [];
    if (assigneeOptions.length > 0) {
      configs.push({
        key: 'assignee',
        label: 'المسؤول',
        type: 'select',
        icon: User,
        isAllOptionLabel: 'كل المسؤولين',
        options: assigneeOptions,
        searchThreshold: 5,
      });
    }
    configs.push({
      key: 'priority',
      label: 'الأولوية',
      type: 'select',
      icon: AlertOctagon,
      isAllOptionLabel: 'كل الأولويات',
      options: priorityOptions,
    });
    if (goalOptions.length > 0) {
      configs.push({
        key: 'goalText',
        label: 'الهدف',
        type: 'select',
        icon: Target,
        isAllOptionLabel: 'جميع الأهداف',
        options: goalOptions,
        searchThreshold: 5,
      });
    }
    return configs;
  }, [assigneeOptions, priorityOptions, goalOptions]);

  const [filterValues, setFilterValues] = useState<FilterValues>({
    assignee: '',
    priority: '',
    goalText: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (key: string, val: any) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: val || '',
    }));
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setFilterValues({
      assignee: '',
      priority: '',
      goalText: '',
    });
  };

  // Final filtered tasks
  const finalFilteredTasks = useMemo(() => {
    return statusTasks.filter((t) => {
      if (filterValues.assignee && t.assignee !== filterValues.assignee) {
        return false;
      }
      if (filterValues.priority && t.priority !== filterValues.priority) {
        return false;
      }
      if (filterValues.goalText && t.goalText !== filterValues.goalText) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(term);
        const matchAssignee = t.assignee.toLowerCase().includes(term);
        const matchGoal = t.goalText && t.goalText.toLowerCase().includes(term);
        if (!matchTitle && !matchAssignee && !matchGoal) {
          return false;
        }
      }
      return true;
    });
  }, [statusTasks, filterValues, searchTerm]);

  if (!isOpen) return null;

  const currentMeta = STATUS_META[selectedStatus] || STATUS_META.all;
  const CurrentIcon = currentMeta.icon;
  const activeSegment = allSegments?.find((s) => s.key === selectedStatus);
  const displayTitle =
    selectedStatus === 'all'
      ? 'جميع المهام'
      : activeSegment
      ? `مهام: ${activeSegment.label}`
      : statusTitle || 'تفاصيل المهام';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in font-cairo"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-11 h-11 rounded-2xl border ${currentMeta.badgeClass} shadow-xs`}
            >
              <CurrentIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{displayTitle}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-200/80 text-gray-800">
                  {statusTasks.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">تفاصيل المهام المصنفة تحت هذه الحالة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Switcher Tabs */}
        {allSegments && allSegments.length > 0 && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-gray-100 bg-gray-50/40 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                selectedStatus === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              )}
            >
              <span>الكل</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                {allTasks.length}
              </span>
            </button>

            {allSegments.map((seg) => {
              const isSelected = selectedStatus === seg.key;
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => setSelectedStatus(seg.key)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                    isSelected
                      ? 'bg-white shadow-xs border'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  )}
                  style={{
                    borderColor: isSelected ? seg.color : 'transparent',
                    color: isSelected ? seg.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>{seg.label}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: isSelected ? `${seg.color}20` : '#F1F5F9',
                      color: isSelected ? seg.color : '#64748B',
                    }}
                  >
                    {seg.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modern FilterBar (Search + Assignee + Priority + Goal + Chips) */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <FilterBar
            filters={filterConfigs}
            values={filterValues}
            onChange={handleFilterChange}
            onClearAll={handleClearAll}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="ابحث عن مهمة، مسؤول، أو هدف..."
            totalResults={finalFilteredTasks.length}
            resultsLabel="مهمة مطابقة"
            className="w-full"
          />
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {finalFilteredTasks.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
                <Filter size={22} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">لا توجد مهام مطابقة</h4>
              <p className="text-xs text-gray-500 mb-4">جرب تغيير خيارات البحث أو الفلترة لعرض المزيد من المهام</p>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <RotateCcw size={13} />
                <span>مسح الفلاتر</span>
              </button>
            </div>
          ) : (
            finalFilteredTasks.map((t) => {
              const isOverdue = t.state === 'overdue';
              const stateMeta = STATUS_META[t.state] || STATUS_META.notStarted;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all bg-white flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: stateMeta.color }}
                          title={stateMeta.label}
                        />
                        <h4
                          className="text-sm font-bold text-gray-900 leading-tight truncate"
                          title={t.title}
                        >
                          {t.title}
                        </h4>
                      </div>
                      {t.goalText && (
                        <p
                          className="text-xs text-indigo-600 font-medium mt-1 truncate"
                          title={t.goalText}
                        >
                          الهدف: {t.goalText}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedStatus === 'all' && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                          style={{
                            color: stateMeta.color,
                            borderColor: `${stateMeta.color}30`,
                            backgroundColor: `${stateMeta.color}10`,
                          }}
                        >
                          {stateMeta.label}
                        </span>
                      )}
                      {t.priority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
                          {PRIORITY_LABELS[t.priority] || t.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-300',
                          t.state === 'completed'
                            ? 'bg-emerald-500'
                            : isOverdue
                            ? 'bg-red-500'
                            : 'bg-indigo-500'
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 w-8 text-left">
                      {t.progress}%
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50 text-[11px] text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <User size={13} className="text-gray-400" />
                        {t.assignee}
                      </span>
                      {t.dueDate && (
                        <span
                          className={clsx(
                            'flex items-center gap-1 font-medium',
                            isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'
                          )}
                        >
                          <Calendar size={13} />
                          {new Date(t.dueDate).toLocaleDateString('ar-SA')}
                          {isOverdue && ' (متأخرة)'}
                        </span>
                      )}
                    </div>
                    {t.cost > 0 && (
                      <span className="font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        {t.cost.toLocaleString('ar-EG')} {t.currency}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            إجمالي المعروض: {finalFilteredTasks.length} من أصل {statusTasks.length} مهمة
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
