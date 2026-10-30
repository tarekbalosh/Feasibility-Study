import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { DonutChart, type DonutSlice } from './DonutChart';

export interface GoalsProgressData {
  totalGoals: number;
  overallProgress: number; // النسبة الكلية مرجحة بأوزان المهام (مثل 38%)
  hasData: boolean;
  segments: {
    key: 'completed' | 'inProgress' | 'notStarted';
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

interface GoalsProgressDonutCardProps {
  data?: GoalsProgressData;
}

export function GoalsProgressDonutCard({ data }: GoalsProgressDonutCardProps) {
  const segments = data?.segments || [];
  const totalGoals = data?.totalGoals || 0;
  const overallProgress = data?.overallProgress || 0;

  const donutSlices: DonutSlice[] = segments.map((s) => ({
    key: s.key,
    label: s.label,
    value: s.count,
    displayValue: `${s.count} أهداف`,
    percentage: s.percentage,
    color: s.color,
  }));

  return (
    <div className="relative flex flex-col justify-between bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Target size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">إنجاز الأهداف</h3>
              <p className="text-xs text-gray-400">حالة إنجاز الأهداف ونسبة التقدم الكلية</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
            {totalGoals} هدف
          </span>
        </div>

        {/* Legend (أعلى الرسم) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2 pb-2 border-b border-gray-50">
          {segments.map((s) => (
            <div
              key={s.key}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50/50"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
              <span className="text-[11px] font-bold text-gray-400">({s.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Donut Chart */}
      <div className="my-auto">
        <DonutChart
          slices={donutSlices}
          centerValue={`${overallProgress}%`}
          centerLabel="نسبة الإنجاز الكلية"
          ariaLabel="رسم دائري لإنجاز الأهداف الاستراتيجية"
          emptyTitle="لا توجد أهداف نشطة"
          emptyDescription="لم يتم العثور على أهداف مرتبطة بهذا النطاق بعد."
          showCalloutThreshold={5}
        />
      </div>

      {/* Footer Meta */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <TrendingUp size={13} className="text-blue-500" />
          متوسط موزون بأوزان المهام
        </span>
        <span className="font-bold text-blue-600">
          {overallProgress}% إنجاز كلي
        </span>
      </div>
    </div>
  );
}
