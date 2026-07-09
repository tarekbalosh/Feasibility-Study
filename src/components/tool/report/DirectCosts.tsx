import React from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { Package } from 'lucide-react';

interface Props { report: FinancialReport }

export default function DirectCosts({ report }: Props) {
  const totalCost = report.items.reduce((s, i) => s + i.cost, 0);
  const totalPrice = report.items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-blue-600" />
        جدول التكاليف المباشرة للمنتجات
      </h2>

      {report.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-right font-bold">#</th>
                  <th className="border border-gray-200 p-3 text-right font-bold">المنتج</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">التكلفة المباشرة</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">سعر البيع</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">نسبة التكلفة</th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3">{i + 1}</td>
                    <td className="border border-gray-200 p-3 font-medium">{item.name}</td>
                    <td className="border border-gray-200 p-3 text-center">{fmtCurrency(item.cost)}</td>
                    <td className="border border-gray-200 p-3 text-center">{fmtCurrency(item.price)}</td>
                    <td className={`border border-gray-200 p-3 text-center font-bold ${item.costRatio > 70 ? 'text-red-600 bg-red-50' : item.costRatio > 50 ? 'text-amber-600' : 'text-green-600'}`}>
                      {fmtPct(item.costRatio)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td className="border border-gray-200 p-3" colSpan={2}>المجموع</td>
                  <td className="border border-gray-200 p-3 text-center">{fmtCurrency(totalCost)}</td>
                  <td className="border border-gray-200 p-3 text-center">{fmtCurrency(totalPrice)}</td>
                  <td className="border border-gray-200 p-3 text-center text-blue-700">{fmtPct(report.avgCostRatio)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-center">
            <p className="text-sm text-gray-600 mb-1">متوسط نسبة التكلفة من سعر البيع</p>
            <p className="text-3xl font-black text-indigo-700">{fmtPct(report.avgCostRatio)}</p>
          </div>

          <p className="mt-4 text-gray-600 text-sm leading-relaxed">
            يوضّح الجدول أعلاه تكلفة كل منتج مقارنة بسعر بيعه. متوسط نسبة التكلفة من سعر البيع هو {fmtPct(report.avgCostRatio)}،
            مما يعني أن هامش الربح الإجمالي على المنتجات يبلغ تقريباً {fmtPct(100 - report.avgCostRatio)} قبل خصم المصاريف التشغيلية.
          </p>
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">لم يتم إدخال بيانات منتجات.</p>
      )}
    </div>
  );
}
