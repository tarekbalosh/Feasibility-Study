import React, { useState } from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { report: FinancialReport }

export default function CostsStudy({ report }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Layers className="w-5 h-5 text-blue-600" />
        دراسة التكاليف المباشرة
      </h2>

      {report.directCostsByYear.map(dc => (
        <div key={dc.year} className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setExpandedYear(expandedYear === dc.year ? null : dc.year)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <h3 className="text-base font-bold text-gray-900">السنة {dc.year}</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                نسبة المواد: {fmtPct(dc.rawMaterialRate)} | نسبة المستلزمات: {fmtPct(dc.suppliesRate)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                الإجمالي: <strong className="text-red-600">{fmtCurrency(dc.totalAll)}</strong>
              </span>
              {expandedYear === dc.year ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {expandedYear === dc.year && (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-right font-bold">الشهر</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">المواد الأولية</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">المستلزمات</th>
                    <th className="border border-gray-200 p-2 text-center font-bold bg-red-50">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {dc.months.map((m, mi) => (
                    <tr key={mi} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2 font-medium">{m.month}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.rawMaterials)}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.supplies)}</td>
                      <td className="border border-gray-200 p-2 text-center font-bold bg-red-50">{fmtCurrency(m.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-bold text-sm">
                    <td className="border border-gray-200 p-2">المجموع السنوي</td>
                    <td className="border border-gray-200 p-2 text-center">{fmtCurrency(dc.totalRaw)}</td>
                    <td className="border border-gray-200 p-2 text-center">{fmtCurrency(dc.totalSupplies)}</td>
                    <td className="border border-gray-200 p-2 text-center text-red-700">{fmtCurrency(dc.totalAll)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        تُحسب التكاليف المباشرة بناءً على نسبة تكلفة المواد الأولية ({fmtPct(report.avgCostRatio)}) ونسبة المستلزمات ({fmtPct(report.directCostsByYear[0].suppliesRate)}) 
        من صافي المبيعات لكل شهر. تنمو التكاليف طردياً مع نمو المبيعات عبر السنوات.
      </p>
    </div>
  );
}
