import React, { useState } from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

interface Props { report: FinancialReport }

export default function CashFlow({ report }: Props) {
  const [showTable, setShowTable] = useState(false);

  // Chart data
  const chartData = report.cashFlow.map(cf => ({
    month: cf.monthIndex,
    label: cf.yearMonth,
    closingBalance: cf.closingBalance,
    recovery: cf.cumulativeRecovery,
  }));

  // Find breakeven month (first month where closing >= initial investment)
  const breakevenMonth = report.cashFlow.find(cf => cf.closingBalance >= report.initialInvestment);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-blue-600" />
        بيان التدفقات النقدية
      </h2>

      {/* Cash Flow Chart */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-3">النقدية المتاحة على مدى 36 شهراً</h3>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => {
                  if (name === 'closingBalance') return [fmtCurrency(value), 'الرصيد النقدي'];
                  return [value, name];
                }}
                labelFormatter={(v) => `الشهر ${v}`}
              />
              <ReferenceLine y={report.initialInvestment} stroke="#f59e0b" strokeDasharray="5 5" label="الاستثمار الأولي" />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="closingBalance" stroke="#3b82f6" strokeWidth={2}
                fill="url(#cashGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {breakevenMonth && (
          <p className="mt-3 text-sm text-center text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
            ✅ يتجاوز الرصيد النقدي الاستثمار الأولي عند الشهر <strong>{breakevenMonth.monthIndex}</strong> ({breakevenMonth.yearMonth})
          </p>
        )}
      </div>

      {/* Year-end summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {report.yearEndCash.map((cash, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 text-center">
            <p className="text-sm text-gray-500 mb-1">رصيد نهاية السنة {i + 1}</p>
            <p className={`text-xl font-black ${cash < 0 ? 'text-red-600' : 'text-blue-700'}`}>{fmtCurrency(cash)}</p>
            <p className="text-xs text-gray-400 mt-1">
              نسبة الاسترداد: {fmtPct(report.cashFlow[i * 12 + 11]?.cumulativeRecovery || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Expandable Table */}
      <button
        onClick={() => setShowTable(!showTable)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200 mb-4"
      >
        <h3 className="text-base font-bold text-gray-900">جدول التدفقات النقدية التفصيلي (36 شهراً)</h3>
        {showTable ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {showTable && (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-2 text-center font-bold">الشهر</th>
                <th className="border border-gray-200 p-2 text-right font-bold">الفترة</th>
                <th className="border border-gray-200 p-2 text-center font-bold">الرصيد الافتتاحي</th>
                <th className="border border-gray-200 p-2 text-center font-bold">النفقات الرأسمالية</th>
                <th className="border border-gray-200 p-2 text-center font-bold">صافي المبيعات</th>
                <th className="border border-gray-200 p-2 text-center font-bold">التكاليف المباشرة</th>
                <th className="border border-gray-200 p-2 text-center font-bold">المصاريف</th>
                <th className="border border-gray-200 p-2 text-center font-bold bg-blue-50">الرصيد الختامي</th>
                <th className="border border-gray-200 p-2 text-center font-bold bg-amber-50">الاسترداد %</th>
              </tr>
            </thead>
            <tbody>
              {report.cashFlow.map((cf, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${cf.closingBalance < 0 ? 'bg-red-50' : ''} ${i === 11 || i === 23 || i === 35 ? 'border-b-2 border-b-blue-300' : ''}`}>
                  <td className="border border-gray-200 p-2 text-center">{cf.monthIndex}</td>
                  <td className="border border-gray-200 p-2 text-right whitespace-nowrap">{cf.yearMonth}</td>
                  <td className="border border-gray-200 p-2 text-center">{fmtCurrency(cf.openingBalance)}</td>
                  <td className="border border-gray-200 p-2 text-center text-red-600">{cf.capitalExpenditure > 0 ? fmtCurrency(cf.capitalExpenditure) : '-'}</td>
                  <td className="border border-gray-200 p-2 text-center text-green-600">{fmtCurrency(cf.netSalesInflow)}</td>
                  <td className="border border-gray-200 p-2 text-center">{fmtCurrency(cf.directCostsOutflow)}</td>
                  <td className="border border-gray-200 p-2 text-center">{fmtCurrency(cf.expensesOutflow)}</td>
                  <td className={`border border-gray-200 p-2 text-center font-bold bg-blue-50 ${cf.closingBalance < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                    {fmtCurrency(cf.closingBalance)}
                  </td>
                  <td className={`border border-gray-200 p-2 text-center font-bold bg-amber-50 ${cf.cumulativeRecovery >= 100 ? 'text-green-700' : 'text-amber-700'}`}>
                    {fmtPct(cf.cumulativeRecovery)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        يبدأ التدفق النقدي برأس المال ({fmtCurrency(report.initialInvestment)}) ويطرح منه النفقات الرأسمالية والتكاليف المباشرة والمصاريف التشغيلية، 
        ويضيف صافي المبيعات. عمود &quot;الاسترداد&quot; يشير إلى نسبة رأس المال المُسترد تراكمياً.
      </p>
    </div>
  );
}
