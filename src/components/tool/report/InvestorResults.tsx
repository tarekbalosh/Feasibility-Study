import React from 'react';
import { FinancialReport, fmtCurrency, fmtPct } from '@/utils/financialCalculations';
import { Mail, Trophy, Users } from 'lucide-react';

interface Props { report: FinancialReport }

export default function InvestorResults({ report }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 print:page-break-before">
      <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-blue-600" />
        النتائج ورسالة المستثمرين
      </h2>

      {/* ROI Summary */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6 text-center">
        <p className="text-sm text-gray-600 mb-2">العائد على الاستثمار الإجمالي (3 سنوات)</p>
        <p className="text-4xl font-black text-green-700 mb-2">{fmtPct(report.roi)}</p>
        <p className="text-sm text-gray-500">
          إجمالي الأرباح: {fmtCurrency(report.totalProfit)} من استثمار {fmtCurrency(report.initialInvestment)}
        </p>
      </div>

      {/* Yearly Profits */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-3">الأرباح السنوية</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-right font-bold">السنة</th>
                <th className="border border-gray-200 p-3 text-center font-bold">صافي الربح</th>
                <th className="border border-gray-200 p-3 text-center font-bold">رصيد النقدية نهاية السنة</th>
                <th className="border border-gray-200 p-3 text-center font-bold">مؤشر الاسترداد</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map(i => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-200 p-3 font-medium">السنة {i + 1}</td>
                  <td className={`border border-gray-200 p-3 text-center font-bold ${report.yearlyProfits[i] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {fmtCurrency(report.yearlyProfits[i])}
                  </td>
                  <td className={`border border-gray-200 p-3 text-center font-bold ${report.yearEndCash[i] < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                    {fmtCurrency(report.yearEndCash[i])}
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    {fmtPct(report.cashFlow[i * 12 + 11]?.cumulativeRecovery || 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td className="border border-gray-200 p-3">المجموع</td>
                <td className={`border border-gray-200 p-3 text-center ${report.totalProfit < 0 ? 'text-red-700' : 'text-green-800'}`}>
                  {fmtCurrency(report.totalProfit)}
                </td>
                <td className="border border-gray-200 p-3 text-center text-blue-800">
                  {fmtCurrency(report.yearEndCash[2])}
                </td>
                <td className="border border-gray-200 p-3 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Shares */}
      {report.partners.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            حصص الشركاء من الأرباح والمبالغ المطلوبة
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-right font-bold">الشريك</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">النسبة</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">المبلغ المطلوب للاستثمار</th>
                  <th className="border border-gray-200 p-3 text-center font-bold">حصته من الأرباح (3 سنوات)</th>
                </tr>
              </thead>
              <tbody>
                {report.partners.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3 font-medium">{p.name}</td>
                    <td className="border border-gray-200 p-3 text-center">{fmtPct(p.percentage)}</td>
                    <td className="border border-gray-200 p-3 text-center font-bold text-blue-700">{fmtCurrency(p.contributionValue)}</td>
                    <td className={`border border-gray-200 p-3 text-center font-bold ${p.profitShare < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {fmtCurrency(p.profitShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investor Letter */}
      <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/50">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">خطاب المستثمرين</h3>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200 text-gray-700 leading-relaxed text-sm">
          <p className="mb-4">السادة المستثمرين الكرام،</p>
          <p className="mb-4">
            نتقدم إليكم بهذه الدراسة الاقتصادية لمشروع <strong>&quot;{report.projectName}&quot;</strong> والتي تبيّن أن المشروع
            يتطلب استثماراً أولياً قدره <strong>{fmtCurrency(report.initialInvestment)}</strong>.
          </p>
          <p className="mb-4">
            وفقاً للدراسة، يُتوقع أن يحقق المشروع صافي أرباح إجمالية تبلغ <strong>{fmtCurrency(report.totalProfit)}</strong> خلال
            السنوات الثلاث الأولى، بعائد على الاستثمار يبلغ <strong>{fmtPct(report.roi)}</strong> وفترة استرداد تقديرية
            <strong> {report.paybackMonths === Infinity ? 'غير محددة' : `${report.paybackMonths} شهر`}</strong>.
          </p>
          {report.partners.length > 0 && (
            <p className="mb-4">
              المبالغ المطلوبة من كل مستثمر لبدء المشروع:
              {report.partners.map((p, i) => (
                <span key={i}>
                  {i > 0 ? '، ' : ' '}
                  <strong>{p.name}</strong>: {fmtCurrency(p.contributionValue)} ({fmtPct(p.percentage)})
                </span>
              ))}
            </p>
          )}
          <p className="mb-4">
            نأمل أن تحظى هذه الفرصة الاستثمارية باهتمامكم ونتطلع إلى شراكة ناجحة ومثمرة.
          </p>
          <p className="text-gray-500">مع أطيب التحيات،</p>
          <p className="font-bold mt-1">فريق {report.projectName}</p>
        </div>
      </div>

      <p className="mt-4 text-gray-500 text-xs text-center">
        ⚠️ تنويه: هذا التقرير استرشادي ولا يعتبر مشورة قانونية أو مالية نهائية. يُوصى بالاستعانة بخبير مالي معتمد قبل اتخاذ قرارات استثمارية.
      </p>
    </div>
  );
}
