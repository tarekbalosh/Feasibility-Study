import React, { useState } from 'react';
import { FinancialReport, fmtCurrency } from '@/utils/financialCalculations';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { report: FinancialReport }

export default function ExpensesStudy({ report }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Receipt className="w-5 h-5 text-blue-600" />
        دراسة المصاريف التشغيلية والإدارية
      </h2>

      {report.expensesByYear.map(ey => (
        <div key={ey.year} className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setExpandedYear(expandedYear === ey.year ? null : ey.year)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-base font-bold text-gray-900">السنة {ey.year}</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                الإجمالي: <strong className="text-purple-700">{fmtCurrency(ey.grandTotal)}</strong>
              </span>
              {expandedYear === ey.year ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {expandedYear === ey.year && (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-right font-bold sticky right-0 bg-gray-50 z-10">البند</th>
                    {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map(m => (
                      <th key={m} className="border border-gray-200 p-1.5 text-center font-bold whitespace-nowrap">{m}</th>
                    ))}
                    <th className="border border-gray-200 p-2 text-center font-bold bg-purple-50">السنوي</th>
                  </tr>
                </thead>
                <tbody>
                  {ey.items.map((item, ii) => (
                    <tr key={ii} className={`hover:bg-gray-50 ${item.name === 'الإهلاك المحتسب' ? 'bg-amber-50/50' : ''}`}>
                      <td className="border border-gray-200 p-2 font-medium whitespace-nowrap sticky right-0 bg-white z-10">{item.name}</td>
                      {item.monthlyValues.map((v, mi) => (
                        <td key={mi} className="border border-gray-200 p-1.5 text-center">{fmtCurrency(v)}</td>
                      ))}
                      <td className="border border-gray-200 p-2 text-center font-bold bg-purple-50">{fmtCurrency(item.annualTotal)}</td>
                    </tr>
                  ))}
                  <tr className="bg-purple-50 font-bold text-sm">
                    <td className="border border-gray-200 p-2 sticky right-0 bg-purple-50 z-10">الإجمالي الشهري</td>
                    {ey.monthlyTotals.map((t, mi) => (
                      <td key={mi} className="border border-gray-200 p-1.5 text-center">{fmtCurrency(t)}</td>
                    ))}
                    <td className="border border-gray-200 p-2 text-center text-purple-800">{fmtCurrency(ey.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        تشمل المصاريف التشغيلية والإدارية جميع البنود الثابتة (الرواتب، الإيجار، الكهرباء، إلخ) 
        بالإضافة إلى الإهلاك المحتسب ({fmtCurrency(report.monthlyDepreciation)} شهرياً). 
        إجمالي المصاريف السنوية للسنة الأولى يبلغ {fmtCurrency(report.expensesByYear[0].grandTotal)}.
      </p>
    </div>
  );
}
