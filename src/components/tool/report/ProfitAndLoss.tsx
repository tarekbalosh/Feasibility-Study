import React, { useState } from 'react';
import { FinancialReport, fmtCurrency, MONTHS } from '@/utils/financialCalculations';
import { TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

interface Props { report: FinancialReport }

export default function ProfitAndLoss({ report }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(1);

  // Chart data: 36-month net profit
  const chartData = report.plByYear.flatMap((py) =>
    py.months.map((m, mi) => ({
      label: `${MONTHS[mi].slice(0, 3)} (${py.year})`,
      netProfit: m.netProfit,
    }))
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-blue-600" />
        بيان الأرباح والخسائر
      </h2>

      {/* 36-month bar chart */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-3">صافي الربح/الخسارة على 36 شهراً</h3>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 8 }} interval={2} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [fmtCurrency(value), 'صافي الربح']}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Bar dataKey="netProfit" fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                // Color bars based on profit/loss
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const fill = payload.netProfit < 0 ? '#ef4444' : '#10b981';
                  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yearly P&L Tables */}
      {report.plByYear.map(py => {
        const hasLoss = py.months.some(m => m.netProfit < 0);
        return (
          <div key={py.year} className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
            <button
              onClick={() => setExpandedYear(expandedYear === py.year ? null : py.year)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-900">السنة {py.year}</h3>
                {hasLoss && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">يحتوي أشهر خسارة</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold ${py.totals.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  صافي الربح: {fmtCurrency(py.totals.netProfit)}
                </span>
                {expandedYear === py.year ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {expandedYear === py.year && (
              <div className="overflow-x-auto p-4">
                <table className="w-full text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-right font-bold">الشهر</th>
                      <th className="border border-gray-200 p-2 text-center font-bold">صافي المبيعات</th>
                      <th className="border border-gray-200 p-2 text-center font-bold">المواد الأولية</th>
                      <th className="border border-gray-200 p-2 text-center font-bold">المستلزمات</th>
                      <th className="border border-gray-200 p-2 text-center font-bold">مجمل الربح</th>
                      <th className="border border-gray-200 p-2 text-center font-bold">المصاريف الإدارية</th>
                      <th className="border border-gray-200 p-2 text-center font-bold bg-blue-50">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {py.months.map((m, mi) => (
                      <tr key={mi} className={`hover:bg-gray-50 ${m.netProfit < 0 ? 'bg-red-50' : ''}`}>
                        <td className="border border-gray-200 p-2 font-medium">{m.month}</td>
                        <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.netSales)}</td>
                        <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.rawMaterials)}</td>
                        <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.supplies)}</td>
                        <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.grossProfit)}</td>
                        <td className="border border-gray-200 p-2 text-center">{fmtCurrency(m.adminExpenses)}</td>
                        <td className={`border border-gray-200 p-2 text-center font-bold ${m.netProfit < 0 ? 'text-red-600 bg-red-100' : 'text-green-700 bg-green-50'}`}>
                          {fmtCurrency(m.netProfit)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-bold text-sm">
                      <td className="border border-gray-200 p-2">الإجمالي السنوي</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(py.totals.netSales)}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(py.totals.rawMaterials)}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(py.totals.supplies)}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(py.totals.grossProfit)}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(py.totals.adminExpenses)}</td>
                      <td className={`border border-gray-200 p-2 text-center font-black ${py.totals.netProfit < 0 ? 'text-red-700' : 'text-green-800'}`}>
                        {fmtCurrency(py.totals.netProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        يُبرز البيان الأشهر ذات الخسارة باللون الأحمر. صافي الربح السنوي ينمو من {fmtCurrency(report.yearlyProfits[0])} 
        في السنة الأولى إلى {fmtCurrency(report.yearlyProfits[2])} في السنة الثالثة.
      </p>
    </div>
  );
}
