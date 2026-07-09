import React from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { Users, Landmark } from 'lucide-react';

interface Props { report: FinancialReport }

export default function InvestmentStructure({ report }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-blue-600" />
        بيانات المشروع وهيكل الاستثمار
      </h2>

      {/* Investment Cost */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100 text-center">
        <p className="text-sm text-gray-500 mb-1">تكلفة الاستثمار الأولي الإجمالية</p>
        <p className="text-3xl font-black text-blue-700">{fmtCurrency(report.initialInvestment)}</p>
      </div>

      {/* Partners Table */}
      {report.partners.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            جدول الشركاء
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-right font-bold">#</th>
                  <th className="border border-gray-200 p-3 text-right font-bold">اسم الشريك</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">نسبة المساهمة</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">قيمة المساهمة</th>
                </tr>
              </thead>
              <tbody>
                {report.partners.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3 text-right">{i + 1}</td>
                    <td className="border border-gray-200 p-3 text-right font-medium">{p.name}</td>
                    <td className="border border-gray-200 p-3 text-center">{fmtPct(p.percentage)}</td>
                    <td className="border border-gray-200 p-3 text-center font-bold">{fmtCurrency(p.contributionValue)}</td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td className="border border-gray-200 p-3" colSpan={2}>المجموع</td>
                  <td className={`border border-gray-200 p-3 text-center ${report.totalPartnerPercentage !== 100 ? 'text-red-600 bg-red-50' : 'text-blue-700'}`}>
                    {fmtPct(report.totalPartnerPercentage)}
                    {report.totalPartnerPercentage !== 100 && <span className="block text-xs text-red-500 mt-1">⚠️ لا تساوي 100%</span>}
                  </td>
                  <td className="border border-gray-200 p-3 text-center text-blue-700">{fmtCurrency(report.initialInvestment)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assets & Establishment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment */}
        {report.equipments.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">الأصول والتجهيزات</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-right font-bold">البند</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {report.equipments.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2">{e.name}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(e.value)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td className="border border-gray-200 p-2">مجموع التجهيزات</td>
                    <td className="border border-gray-200 p-2 text-center text-blue-700">{fmtCurrency(report.equipmentsTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Establishment Expenses */}
        {report.establishmentExpenses.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">مصاريف التأسيس</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-right font-bold">البند</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {report.establishmentExpenses.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2">{e.name}</td>
                      <td className="border border-gray-200 p-2 text-center">{fmtCurrency(e.value)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td className="border border-gray-200 p-2">مجموع مصاريف التأسيس</td>
                    <td className="border border-gray-200 p-2 text-center text-blue-700">{fmtCurrency(report.establishmentTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex justify-between items-center">
        <span className="font-bold text-gray-800">الإجمالي العام (التجهيزات + التأسيس)</span>
        <span className="text-2xl font-black text-indigo-700">{fmtCurrency(report.assetsGrandTotal)}</span>
      </div>

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        يتكون الاستثمار الأولي من تجهيزات بقيمة {fmtCurrency(report.equipmentsTotal)} ومصاريف تأسيس بقيمة {fmtCurrency(report.establishmentTotal)}، 
        بإجمالي {fmtCurrency(report.assetsGrandTotal)} يتم إهلاكه على 36 شهراً بمعدل {fmtCurrency(report.monthlyDepreciation)} شهرياً.
      </p>
    </div>
  );
}
