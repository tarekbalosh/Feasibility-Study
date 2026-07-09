import React, { useState } from 'react';
import { FinancialReport, fmtCurrency, fmtPct, MONTHS } from '@/utils/financialCalculations';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface Props { report: FinancialReport }

export default function SalesStudy({ report }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(1);

  // Build chart data: 12 months × 3 years
  const chartData = MONTHS.map((m, mi) => ({
    month: m,
    'السنة 1': report.salesByYear[0].months[mi].netSales,
    'السنة 2': report.salesByYear[1].months[mi].netSales,
    'السنة 3': report.salesByYear[2].months[mi].netSales,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-blue-600" />
        دراسة المبيعات
      </h2>

      {/* Sales Chart */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-3">تطوّر المبيعات الشهرية عبر الأعوام الثلاثة</h3>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [fmtCurrency(value), '']}
              />
              <Legend />
              <Line type="monotone" dataKey="السنة 1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="السنة 2" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="السنة 3" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rates info */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg px-4 py-2 border border-orange-100">
          <span className="text-sm text-gray-600">نسبة العمولة: </span>
          <span className="font-bold text-orange-700">{fmtPct(report.commissionRate)}</span>
        </div>
        <div className="bg-red-50 rounded-lg px-4 py-2 border border-red-100">
          <span className="text-sm text-gray-600">نسبة الضريبة: </span>
          <span className="font-bold text-red-700">{fmtPct(report.taxRate)}</span>
        </div>
      </div>

      {/* Yearly Tables (Accordion) */}
      {report.salesByYear.map(sy => (
        <div key={sy.year} className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <button
            onClick={() => setExpandedYear(expandedYear === sy.year ? null : sy.year)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-base font-bold text-gray-900">السنة {sy.year}</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                إجمالي صافي المبيعات: <strong className="text-blue-700">{fmtCurrency(sy.totalNet)}</strong>
              </span>
              {expandedYear === sy.year ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {expandedYear === sy.year && (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-right font-bold">الشهر</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">إجمالي المبيعات</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">العمولة ({fmtPct(report.commissionRate)})</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">الضريبة ({fmtPct(report.taxRate)})</th>
                    <th className="border border-gray-200 p-2 text-center font-bold bg-blue-50">صافي المبيعات</th>
                  </tr>
                </thead>
                <tbody>
                  {sy.months.map((m, mi) => (
                    <tr key={mi} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2 font-medium">{m.month}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.grossSales)}</td>
                      <td className="border border-gray-200 p-2 text-center text-orange-600">{fmtCurrency(m.commissionValue)}</td>
                      <td className="border border-gray-200 p-2 text-center text-red-600">{fmtCurrency(m.taxValue)}</td>
                      <td className="border border-gray-200 p-2 text-center font-bold bg-blue-50">{fmtCurrency(m.netSales)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold text-sm">
                    <td className="border border-gray-200 p-2">المجموع السنوي</td>
                    <td className="border border-gray-200 p-2 text-center">{fmtCurrency(sy.totalGross)}</td>
                    <td className="border border-gray-200 p-2 text-center text-orange-700">{fmtCurrency(sy.totalCommission)}</td>
                    <td className="border border-gray-200 p-2 text-center text-red-700">{fmtCurrency(sy.totalTax)}</td>
                    <td className="border border-gray-200 p-2 text-center text-blue-800">{fmtCurrency(sy.totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        تُعرض المبيعات بعد خصم العمولة ({fmtPct(report.commissionRate)}) والضريبة ({fmtPct(report.taxRate)}) من إجمالي المبيعات.
        لاحظ نمو المبيعات من {fmtCurrency(report.salesByYear[0].totalNet)} في السنة الأولى
        إلى {fmtCurrency(report.salesByYear[2].totalNet)} في السنة الثالثة.
      </p>
    </div>
  );
}
