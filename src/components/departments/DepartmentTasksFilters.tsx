import React, { useMemo } from 'react';
import { User, Briefcase, CheckCircle2 } from 'lucide-react';
import {
  FilterBar,
  FilterItemConfig,
  FilterValues,
} from '@/components/ui/filters';

export interface TaskStatusCounts {
  all: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
}

interface DepartmentTasksFiltersProps {
  statusFilter: string[];
  onStatusChange: (statuses: string[]) => void;
  assigneeFilter: string[];
  onAssigneeChange: (assignees: string[]) => void;
  planIdFilter: string;
  onPlanIdChange: (planId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  statusCounts?: TaskStatusCounts;
  availableAssignees?: string[];
  plans?: { id: string; name: string }[];
}

const STATUS_CHIPS = [
  {
    id: 'all',
    label: 'الكل',
    activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
    inactiveClass: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
    countBadgeActive: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-slate-200 text-slate-700',
  },
  {
    id: 'todo',
    label: 'لم تبدأ',
    activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm',
    inactiveClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
    countBadgeActive: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-slate-200 text-slate-700',
  },
  {
    id: 'in_progress',
    label: 'قيد الإنجاز',
    activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    inactiveClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    countBadgeActive: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-blue-200/70 text-blue-800',
  },
  {
    id: 'done',
    label: 'أنجزت',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    inactiveClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    countBadgeActive: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-emerald-200/70 text-emerald-800',
  },
  {
    id: 'overdue',
    label: 'متأخرة',
    activeClass: 'bg-red-600 text-white border-red-600 shadow-sm',
    inactiveClass: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
    countBadgeActive: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-red-200/70 text-red-800',
  },
];

export function DepartmentTasksFilters({
  statusFilter = [],
  onStatusChange,
  assigneeFilter = [],
  onAssigneeChange,
  planIdFilter = '',
  onPlanIdChange,
  searchQuery = '',
  onSearchChange,
  onClearAll,
  hasActiveFilters,
  statusCounts = { all: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 },
  availableAssignees = [],
  plans = [],
}: DepartmentTasksFiltersProps) {
  // Quick status chip click
  const handleChipClick = (id: string) => {
    if (id === 'all') {
      onStatusChange([]);
      return;
    }
    if (statusFilter.includes(id)) {
      onStatusChange(statusFilter.filter((s) => s !== id));
    } else {
      onStatusChange([...statusFilter, id]);
    }
  };

  const isAllSelected = statusFilter.length === 0;

  // Build filter configurations for the unified FilterBar
  const filterConfigs: FilterItemConfig[] = useMemo(() => {
    const list: FilterItemConfig[] = [];

    // Assignee Filter (Multi-select)
    list.push({
      key: 'assignee',
      label: 'المسؤول',
      type: 'multi-select',
      icon: User,
      options: availableAssignees.map((name) => ({
        value: name,
        label: name,
        initials: name.trim().slice(0, 2),
      })),
      searchThreshold: 5,
    });

    // Plan Filter (Single select)
    if (plans.length > 0) {
      list.push({
        key: 'planId',
        label: 'الخطة',
        type: 'select',
        icon: Briefcase,
        isAllOptionLabel: 'كل الخطط',
        options: plans.map((p) => ({
          value: p.id,
          label: p.name,
        })),
        searchThreshold: 5,
      });
    }

    return list;
  }, [availableAssignees, plans]);

  const currentValues: FilterValues = useMemo(
    () => ({
      assignee: assigneeFilter,
      planId: planIdFilter,
    }),
    [assigneeFilter, planIdFilter]
  );

  const handleFilterChange = (key: string, val: any) => {
    if (key === 'assignee') {
      onAssigneeChange(Array.isArray(val) ? val : val ? [val] : []);
    } else if (key === 'planId') {
      onPlanIdChange(val || '');
    }
  };

  return (
    <div className="space-y-3 mb-6" dir="rtl">
      {/* Quick Status Chips Bar with Counters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_CHIPS.map((chip) => {
          const isSelected = chip.id === 'all' ? isAllSelected : statusFilter.includes(chip.id);
          const count = statusCounts[chip.id as keyof TaskStatusCounts] ?? 0;

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 shrink-0 select-none ${
                isSelected ? chip.activeClass : chip.inactiveClass
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? chip.countBadgeActive : chip.countBadgeInactive
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Unified Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        values={currentValues}
        onChange={handleFilterChange}
        onClearAll={onClearAll}
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="ابحث في عنوان المهمة..."
        showChips={true}
      />
    </div>
  );
}

export default DepartmentTasksFilters;
