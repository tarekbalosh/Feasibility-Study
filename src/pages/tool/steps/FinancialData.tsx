import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { DollarSign, TrendingUp, Wallet, Clock } from 'lucide-react';

export default function FinancialData() {
  const { form } = useFeasibilityTool();
  const { register, watch, formState: { errors } } = form;

  const initialCapital = watch('financialData.initialCapital') || 0;
  const monthlyOperatingCosts = watch('financialData.monthlyOperatingCosts') || 0;
  const expectedMonthlyRevenue = watch('financialData.expectedMonthlyRevenue') || 0;

  const netProfitMonthly = expectedMonthlyRevenue - monthlyOperatingCosts;

  const paybackPeriodMonths = netProfitMonthly > 0 ? (initialCapital / netProfitMonthly) : 0;
  const paybackPeriodFormatted = paybackPeriodMonths > 0
    ? paybackPeriodMonths < 12
      ? `${Math.ceil(paybackPeriodMonths)} شهر`
      : `${(paybackPeriodMonths / 12).toFixed(1)} سنة`
    : 'غير متوفر';

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);

  const inputClass = (hasError: boolean) =>
    `w-full pr-10 pl-4 py-3 rounded-lg border ${
      hasError
        ? 'border-red-500'
        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
    } focus:ring-2 focus:outline-none transition-all`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ——— البيانات المالية الأساسية ——— */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">البيانات المالية الأساسية</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رأس المال المبدئي (ريال)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  {...register('financialData.initialCapital', { valueAsNumber: true })}
                  className={inputClass(!!errors.financialData?.initialCapital)}
                  placeholder="0"
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
                />
              </div>
              {errors.financialData?.initialCapital && (
                <p className="mt-1 text-sm text-red-500">{errors.financialData.initialCapital.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التكاليف التشغيلية الشهرية (ريال)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  {...register('financialData.monthlyOperatingCosts', { valueAsNumber: true })}
                  className={inputClass(!!errors.financialData?.monthlyOperatingCosts)}
                  placeholder="0"
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
                />
              </div>
              {errors.financialData?.monthlyOperatingCosts && (
                <p className="mt-1 text-sm text-red-500">{errors.financialData.monthlyOperatingCosts.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الإيرادات المتوقعة الشهرية (ريال)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  {...register('financialData.expectedMonthlyRevenue', { valueAsNumber: true })}
                  className={inputClass(!!errors.financialData?.expectedMonthlyRevenue)}
                  placeholder="0"
                  onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                  onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
                />
              </div>
              {errors.financialData?.expectedMonthlyRevenue && (
                <p className="mt-1 text-sm text-red-500">{errors.financialData.expectedMonthlyRevenue.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ——— ملخص حسابي آني ——— */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-2xl shadow-lg text-white self-start sticky top-6">
          <h3 className="text-xl font-bold mb-6">ملخص حسابي آني</h3>

          <div className="space-y-6">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-blue-100 text-sm mb-1">صافي الربح الشهري المتوقع</p>
              <p className={`text-2xl font-bold ${netProfitMonthly > 0 ? 'text-green-300' : netProfitMonthly < 0 ? 'text-red-300' : 'text-white'}`}>
                {formatCurrency(netProfitMonthly)}
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-blue-100 text-sm mb-1 flex items-center gap-1">
                <Clock size={16} />
                فترة الاسترداد التقريبية
              </p>
              <p className="text-2xl font-bold text-white">
                {paybackPeriodFormatted}
              </p>
            </div>

            <p className="text-xs text-blue-200 leading-relaxed">
              * هذه أرقام تقريبية مبدئية تعتمد على المدخلات، وسيتم إجراء تحليل أعمق في الخطوة التالية.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
