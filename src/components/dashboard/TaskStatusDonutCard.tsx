import React, { useState } from 'react';
import { CheckCircle2, ListFilter } from 'lucide-react';
import { DonutChart, type DonutSlice } from './DonutChart';
import { TaskDetailModal, type TaskItemModal } from './TaskDetailModal';

export interface TaskStatusData {
  total: number;
  hasData: boolean;
  segments: {
    key: 'completed' | 'inProgress' | 'notStarted' | 'overdue';
    label: string;
    count: number;
    percentage: number;
    color: string;
    tasks: TaskItemModal[];
  }[];
}

interface TaskStatusDonutCardProps {
  data?: TaskStatusData;
}

export function TaskStatusDonutCard({ data }: TaskStatusDonutCardProps) {
  const [activeModalKey, setActiveModalKey] = useState<'completed' | 'inProgress' | 'notStarted' | 'overdue' | 'all' | null>(null);

  const segments = data?.segments || [];
  const total = data?.total || 0;

  const donutSlices: DonutSlice[] = segments.map((s) => ({
    key: s.key,
    label: s.label,
    value: s.count,
    displayValue: `${s.count} مهمة`,
    percentage: s.percentage,
    color: s.color,
  }));

  const activeSegment = segments.find((s) => s.key === activeModalKey);

  return (
    <div className="relative flex flex-col justify-between bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow font-cairo">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">حالة المهام</h3>
              <p className="text-xs text-gray-400">توزيع المهام بحسب حالة إنجازها</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveModalKey('all')}
            className="text-xs font-bold text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-gray-100 transition-colors cursor-pointer"
            title="انقر لعرض وتصفية جميع المهام"
          >
            {total} مهمة
          </button>
        </div>

        {/* Legend (أعلى الرسم) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2 pb-2 border-b border-gray-50">
          {segments.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveModalKey(s.key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100/80 transition-colors cursor-pointer group"
              title={`انقر لعرض المهام (${s.label})`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
              <span className="text-[11px] font-bold text-gray-400">({s.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Donut Chart */}
      <div className="my-auto">
        <DonutChart
          slices={donutSlices}
          centerValue={total}
          centerLabel="إجمالي المهام"
          ariaLabel="رسم دائري لحالة المهام"
          hoverSuffix="انقر للتفاصيل"
          emptyTitle="لا توجد مهام بعد"
          emptyDescription="لم يتم العثور على أي مهام مسندة في هذا النطاق."
          onSliceClick={(slice) => {
            setActiveModalKey(slice.key as any);
          }}
        />
      </div>

      {/* Hint Footer */}
      <button
        type="button"
        onClick={() => setActiveModalKey('all')}
        className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors w-full cursor-pointer"
        title="انقر لعرض وتصفية المهام"
      >
        <ListFilter size={13} />
        <span>انقر على أي شريحة لعرض وتصفية قائمة المهام</span>
      </button>

      {/* Modal تفاصيل المهام */}
      {activeModalKey && (
        <TaskDetailModal
          isOpen={Boolean(activeModalKey)}
          onClose={() => setActiveModalKey(null)}
          statusKey={activeModalKey}
          statusTitle={activeSegment ? `مهام: ${activeSegment.label}` : 'جميع المهام'}
          tasks={activeSegment?.tasks || []}
          allSegments={segments}
        />
      )}
    </div>
  );
}
