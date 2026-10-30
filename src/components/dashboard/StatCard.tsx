import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatCardColor = 'indigo' | 'emerald' | 'amber' | 'blue';

const ICON_COLORS: Record<StatCardColor, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
};

/** ارتفاع منطقة التفاصيل ثابت في كل البطاقات ليبقى الصف متناسقاً قبل التحميل وبعده */
export const STAT_DETAILS_MIN_H = 'min-h-[96px]';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color: StatCardColor;
  /** منطقة التفاصيل تحت الخط الفاصل */
  children?: React.ReactNode;
}

/**
 * بطاقة رقم موحّدة: العنوان والأيقونة، ثم الرقم، ثم خط فاصل رفيع، ثم التفاصيل.
 */
export function StatCard({ title, value, icon: Icon, color, children }: StatCardProps) {
  return (
    <div className="relative rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${ICON_COLORS[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {children && (
        <div className={`mt-4 pt-3 border-t border-gray-100 ${STAT_DETAILS_MIN_H}`}>{children}</div>
      )}
    </div>
  );
}

/** هيكل تحميل بنفس أبعاد البطاقة */
export function StatCardSkeleton() {
  return (
    <div
      className="relative rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex flex-col h-full animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 rounded bg-gray-100" />
        <div className="h-10 w-10 rounded-xl bg-gray-100" />
      </div>
      <div className="h-9 w-16 rounded bg-gray-100" />
      <div className={`mt-4 pt-3 border-t border-gray-100 ${STAT_DETAILS_MIN_H}`}>
        <div className="flex flex-wrap gap-1.5">
          <div className="h-[26px] w-16 rounded-full bg-gray-100" />
          <div className="h-[26px] w-20 rounded-full bg-gray-100" />
          <div className="h-[26px] w-14 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

/** حالة فارغة مختصرة داخل البطاقة */
export function StatCardEmpty({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between text-xs text-gray-500">{children}</div>;
}
