import React from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { FileText, TrendingUp, Clock, DollarSign, BarChart3 } from 'lucide-react';

interface Props { report: FinancialReport }

export default function ReportCover({ report }: Props) {
  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="print:page-break-after">
      {/* Cover */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-8 md:p-12 text-white text-center mb-8 shadow-xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-2xl mb-6">
          <FileText className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3">دراسة الجدوى الاقتصادية</h1>
        <p className="text-2xl font-bold text-blue-200 mb-4">{report.projectName || 'مشروع بدون اسم'}</p>
        <p className="text-blue-300 text-sm">{today}</p>
      </div>

      {/* Executive Summary KPIs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          الملخص التنفيذي
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">تكلفة الاستثمار</p>
            <p className="text-lg font-black text-gray-900">{fmtCurrency(report.initialInvestment)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">العائد على الاستثمار</p>
            <p className="text-lg font-black text-green-700">{fmtPct(report.roi)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">فترة الاسترداد</p>
            <p className="text-lg font-black text-purple-700">
              {report.paybackMonths === Infinity ? 'غير محددة' : `${report.paybackMonths} شهر`}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
            <DollarSign className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">إجمالي الأرباح (3 سنوات)</p>
            <p className="text-lg font-black text-amber-700">{fmtCurrency(report.totalProfit)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-right font-bold">البيان</th>
                <th className="border border-gray-200 p-3 text-center font-bold">السنة الأولى</th>
                <th className="border border-gray-200 p-3 text-center font-bold">السنة الثانية</th>
                <th className="border border-gray-200 p-3 text-center font-bold">السنة الثالثة</th>
                <th className="border border-gray-200 p-3 text-center font-bold bg-blue-50">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-3 font-medium">صافي الأرباح</td>
                {report.yearlyProfits.map((p, i) => (
                  <td key={i} className={`border border-gray-200 p-3 text-center font-bold ${p < 0 ? 'text-red-600 bg-red-50' : 'text-green-700'}`}>
                    {fmtCurrency(p)}
                  </td>
                ))}
                <td className={`border border-gray-200 p-3 text-center font-black bg-blue-50 ${report.totalProfit < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                  {fmtCurrency(report.totalProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-gray-600 text-sm leading-relaxed">
          يستهدف مشروع <strong>{report.projectName}</strong> استثماراً أولياً قدره {fmtCurrency(report.initialInvestment)}.
          من المتوقع تحقيق صافي أرباح إجمالية تبلغ {fmtCurrency(report.totalProfit)} خلال السنوات الثلاث الأولى،
          بعائد على الاستثمار {fmtPct(report.roi)} وفترة استرداد تقديرية {report.paybackMonths === Infinity ? 'غير محددة' : `${report.paybackMonths} شهر`}.
        </p>
      </div>
    </div>
  );
}
