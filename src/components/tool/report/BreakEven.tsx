import React from 'react';
import { FinancialReport, fmtCurrency } from '@/utils/financialCalculations';
import { Scale } from 'lucide-react';

interface Props { report: FinancialReport }

export default function BreakEven({ report }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Scale className="w-5 h-5 text-blue-600" />
        نقطة التعادل
      </h2>

      <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>نقطة التعادل</strong> هي الحد الأدنى من المبيعات الذي يجب تحقيقه لتغطية جميع التكاليف الثابتة والمتغيرة، 
          بحيث لا يحقق المشروع ربحاً ولا خسارة. أي مبيعات تتجاوز هذا الحد تعني ربحاً صافياً للمشروع.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-right font-bold">البيان</th>
              <th className="border border-gray-200 p-3 text-center font-bold">السنة الأولى</th>
              <th className="border border-gray-200 p-3 text-center font-bold">السنة الثانية</th>
              <th className="border border-gray-200 p-3 text-center font-bold">السنة الثالثة</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-200 p-3 font-medium">المصاريف الثابتة الشهرية</td>
              {report.breakEven.map((be, i) => (
                <td key={i} className="border border-gray-200 p-3 text-center">{fmtCurrency(be.fixedCosts)}</td>
              ))}
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-200 p-3 font-medium">نسبة التكاليف المتغيرة</td>
              {report.breakEven.map((be, i) => (
                <td key={i} className="border border-gray-200 p-3 text-center">
                  {new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(be.variableCostRatio)}%
                </td>
              ))}
            </tr>
            <tr className="bg-amber-50">
              <td className="border border-gray-200 p-3 font-bold text-amber-800">نقطة التعادل الشهرية</td>
              {report.breakEven.map((be, i) => (
                <td key={i} className="border border-gray-200 p-3 text-center font-black text-amber-700 text-lg">
                  {fmtCurrency(be.breakEvenMonthly)}
                </td>
              ))}
            </tr>
            <tr className="bg-orange-50">
              <td className="border border-gray-200 p-3 font-bold text-orange-800">نقطة التعادل اليومية (30 يوم)</td>
              {report.breakEven.map((be, i) => (
                <td key={i} className="border border-gray-200 p-3 text-center font-bold text-orange-700">
                  {fmtCurrency(be.breakEvenDaily)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual comparison with actual sales */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {report.breakEven.map((be, i) => {
          const avgMonthlySales = report.salesByYear[i].totalGross / 12;
          const aboveBE = avgMonthlySales > be.breakEvenMonthly;
          const ratio = be.breakEvenMonthly > 0 ? (avgMonthlySales / be.breakEvenMonthly) * 100 : 0;

          return (
            <div key={i} className={`rounded-xl p-4 border text-center ${aboveBE ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm text-gray-600 mb-1">السنة {i + 1}</p>
              <p className="text-xs text-gray-500 mb-2">
                متوسط المبيعات: {fmtCurrency(avgMonthlySales)}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-lg font-black ${aboveBE ? 'text-green-700' : 'text-red-700'}`}>
                  {aboveBE ? '✅' : '⚠️'}
                </span>
                <span className={`text-sm font-bold ${aboveBE ? 'text-green-700' : 'text-red-700'}`}>
                  {aboveBE ? `فوق التعادل بـ ${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(ratio - 100)}%` : 'تحت نقطة التعادل'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        نقطة التعادل تُحسب بقسمة المصاريف الثابتة على هامش المساهمة (1 − نسبة التكاليف المتغيرة). 
        اليومية تُحسب بقسمة الشهرية على 30 يوم عمل.
      </p>
    </div>
  );
}
