import React, { useState } from 'react';
import { Wallet, Calendar } from 'lucide-react';
import { DonutChart, type DonutSlice } from './DonutChart';

export interface MonthBudgetDetail {
  monthIndex: number;
  monthName: string;
  amount: number;
  percentage: number;
}

export interface CurrencyBudgetDetail {
  currency: string;
  total: number;
  tasksCount: number;
  monthly: MonthBudgetDetail[];
}

export interface BudgetYearData {
  currencies: string[];
  defaultCurrency: string;
  hasData: boolean;
  byCurrency: CurrencyBudgetDetail[];
}

interface YearBudgetDonutCardProps {
  data?: BudgetYearData;
  activeCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

const SYMBOLS: Record<string, string> = {
  SAR: 'ر.س',
  AED: 'د.إ',
  USD: '$',
  EUR: '€',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  EGP: 'ج.م',
};

// باليت ألوان متناسقة للأشهر النشطة (بنفسجي/أرجواني/نيلي)
const MONTH_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a855f7',
  '#c084fc', '#4f46e5', '#4338ca', '#3730a3',
  '#6d28d9', '#5b21b6', '#9333ea', '#7e22ce'
];

const fmt = (n: number) => Math.round(n).toLocaleString('ar-EG');

export function YearBudgetDonutCard({
  data,
  activeCurrency: externalCurrency,
  onCurrencyChange,
}: YearBudgetDonutCardProps) {
  const currencies = data?.currencies || ['SAR'];
  const [internalCurrency, setInternalCurrency] = useState(data?.defaultCurrency || currencies[0] || 'SAR');

  const selectedCurrency = externalCurrency || internalCurrency;
  const currentBudgetData = data?.byCurrency?.find((c) => c.currency === selectedCurrency) || data?.byCurrency?.[0];

  const total = currentBudgetData?.total || 0;
  const hasData = total > 0;
  const currencySymbol = SYMBOLS[selectedCurrency] || selectedCurrency;

  const handleCurrencySelect = (cur: string) => {
    setInternalCurrency(cur);
    if (onCurrencyChange) onCurrencyChange(cur);
  };

  const donutSlices: DonutSlice[] = (currentBudgetData?.monthly || []).map((m, idx) => {
    const isEmpty = m.amount <= 0;
    return {
      key: `month-${m.monthIndex}`,
      label: m.monthName,
      value: m.amount,
      displayValue: `${fmt(m.amount)} ${currencySymbol}`,
      percentage: m.percentage,
      color: isEmpty ? '#f1f5f9' : MONTH_COLORS[idx % MONTH_COLORS.length],
      isMuted: isEmpty,
    };
  });

  // تحديد أعلى 3 أشهر إنفاقاً
  const topMonths = (currentBudgetData?.monthly || [])
    .filter((m) => m.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="relative flex flex-col justify-between bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">الميزانية الشهرية للسنة</h3>
              <p className="text-xs text-gray-400">توزيع التكلفة على أشهر السنة (12 شهراً)</p>
            </div>
          </div>

          {/* تبديل العملة */}
          {currencies.length > 1 && (
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {currencies.map((cur) => (
                <button
                  key={cur}
                  id={`year-budget-currency-${cur}`}
                  onClick={() => handleCurrencySelect(cur)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    cur === selectedCurrency
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {SYMBOLS[cur] || cur}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legend مصغر للأشهر الأكثر إنفاقاً */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2 pb-2 border-b border-gray-50 min-h-[32px]">
          {topMonths.length > 0 ? (
            topMonths.map((m) => (
              <span
                key={m.monthIndex}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: MONTH_COLORS[m.monthIndex % MONTH_COLORS.length] }}
                />
                <span>{m.monthName}</span>
                <span className="text-[11px] font-bold text-violet-600">{m.percentage}%</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">12 شهراً من يناير إلى ديسمبر</span>
          )}
        </div>
      </div>

      {/* Donut Chart */}
      <div className="my-auto">
        <DonutChart
          slices={donutSlices}
          centerValue={`${fmt(total)}`}
          centerLabel={`ميزانية السنة (${currencySymbol})`}
          ariaLabel="رسم دائري لميزانية السنة الشهرية"
          currencySymbol={currencySymbol}
          emptyTitle="لا توجد ميزانية مسجلة"
          emptyDescription="لم يتم تسجيل أي تكاليف للمهام أو الأهداف بهذه العملة."
          showCalloutThreshold={8}
        />
      </div>

      {/* Footer Meta */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar size={13} />
          السنة المالية الحالية
        </span>
        <span className="font-semibold text-gray-600">
          {currentBudgetData?.tasksCount || 0} مهمة بميزانية
        </span>
      </div>
    </div>
  );
}
