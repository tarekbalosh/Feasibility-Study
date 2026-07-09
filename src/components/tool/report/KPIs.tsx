import React from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { Gauge, TrendingUp, Clock, Target, Scale } from 'lucide-react';

interface Props { report: FinancialReport }

export default function KPIs({ report }: Props) {
  const kpis = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'العائد على الاستثمار',
      value: fmtPct(report.roi),
      color: report.roi > 20 ? 'text-green-700 bg-green-50 border-green-200' : report.roi > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200',
      iconColor: report.roi > 20 ? 'text-green-600' : report.roi > 0 ? 'text-amber-600' : 'text-red-600',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'فترة الاسترداد',
      value: report.paybackMonths === Infinity ? 'غير محددة' : `${report.paybackMonths} شهر`,
      color: report.paybackMonths <= 24 ? 'text-green-700 bg-green-50 border-green-200' : report.paybackMonths <= 36 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200',
      iconColor: report.paybackMonths <= 24 ? 'text-green-600' : report.paybackMonths <= 36 ? 'text-amber-600' : 'text-red-600',
    },
    {
      icon: <Scale className="w-6 h-6" />,
      label: 'نقطة التعادل الشهرية (سنة 1)',
      value: fmtCurrency(report.breakEven[0]?.breakEvenMonthly || 0),
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 md:p-8 mb-6 text-white shadow-xl">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-blue-300" />
        المؤشرات المالية الرئيسية (KPIs)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className={`rounded-xl p-5 border-2 ${kpi.color}`}>
            <div className={`mb-3 ${kpi.iconColor}`}>{kpi.icon}</div>
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className="text-2xl font-black">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Profit Margins per year */}
      <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
        <h3 className="text-base font-bold text-white/90 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-300" />
          هامش صافي الربح حسب السنة
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {report.profitMargins.map((margin, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-white/60 mb-1">السنة {i + 1}</p>
              <p className={`text-xl font-black ${margin < 0 ? 'text-red-400' : margin < 10 ? 'text-amber-400' : 'text-green-400'}`}>
                {fmtPct(margin)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
          <p className="text-[10px] text-white/50 mb-0.5">الاستثمار</p>
          <p className="text-sm font-bold text-white/90">{fmtCurrency(report.initialInvestment)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
          <p className="text-[10px] text-white/50 mb-0.5">ربح سنة 1</p>
          <p className={`text-sm font-bold ${report.yearlyProfits[0] < 0 ? 'text-red-400' : 'text-green-400'}`}>{fmtCurrency(report.yearlyProfits[0])}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
          <p className="text-[10px] text-white/50 mb-0.5">ربح سنة 2</p>
          <p className={`text-sm font-bold ${report.yearlyProfits[1] < 0 ? 'text-red-400' : 'text-green-400'}`}>{fmtCurrency(report.yearlyProfits[1])}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
          <p className="text-[10px] text-white/50 mb-0.5">ربح سنة 3</p>
          <p className={`text-sm font-bold ${report.yearlyProfits[2] < 0 ? 'text-red-400' : 'text-green-400'}`}>{fmtCurrency(report.yearlyProfits[2])}</p>
        </div>
      </div>
    </div>
  );
}
