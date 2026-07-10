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
      <div className="mt-12 relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg p-8 md:p-10 print:shadow-none print:border-gray-200">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full -z-10 opacity-60 print:hidden"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-tr-full -z-10 opacity-60 print:hidden"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">خطاب المستثمرين</h3>
              <p className="text-gray-500 text-sm mt-1">ملخص تنفيذي موجّه للشركاء والممولين</p>
            </div>
          </div>
          <div className="hidden sm:block text-left text-sm text-gray-400 font-medium">
            وثيقة رسمية <br/>
            {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        
        <div className="text-gray-700 leading-loose text-base md:text-lg">
          <p className="text-xl font-bold text-gray-900 mb-6">السادة المستثمرين الكرام،</p>
          
          <p className="mb-6">
            يسعدنا أن نضع بين أيديكم ملخص الدراسة الاقتصادية والمالية لمشروع <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">&quot;{report.projectName}&quot;</span>. 
            تُشير دراساتنا وتحليلاتنا للسوق إلى أن إطلاق المشروع يتطلب استثماراً أولياً يُقدر بـ <span className="text-blue-700 font-black">{fmtCurrency(report.initialInvestment)}</span>.
          </p>
          
          <p className="mb-6">
            بناءً على التوقعات المالية المدروسة، يُتوقع أن يحقق المشروع أداءً مالياً قوياً، بصافي أرباح إجمالية تقدر بـ <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded">{fmtCurrency(report.totalProfit)}</span> خلال السنوات الثلاث الأولى من التشغيل. 
            كما يُتوقع أن يحقق المشروع عائداً إجمالياً على الاستثمار (ROI) بنسبة <span className="text-emerald-700 font-black">{fmtPct(report.roi)}</span>، مع فترة استرداد تقديرية لرأس المال تبلغ <span className="font-black text-gray-900">{report.paybackMonths === Infinity ? 'غير محددة' : `${report.paybackMonths} شهر`}</span>.
          </p>

          {report.partners.length > 0 && (
            <div className="my-8 bg-gray-50/50 p-6 rounded-xl border border-gray-200/60 shadow-sm print:shadow-none">
              <p className="font-bold text-gray-900 mb-4">هيكل رأس المال والمساهمات المطلوبة للبدء:</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {report.partners.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm print:shadow-none print:border-gray-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200 print:shadow-none"></div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">حصة {fmtPct(p.percentage)}</div>
                    </div>
                    <div className="font-black text-blue-700">{fmtCurrency(p.contributionValue)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mb-8">
            نحن نؤمن إيماناً راسخاً بالفرص الواعدة التي يقدمها هذا المشروع، ونتطلع لبناء شراكة استراتيجية مثمرة تحقق تطلعاتنا المشتركة. نحن على أتم الاستعداد لمناقشة التفاصيل المالية والتشغيلية المذكورة في التقرير الشامل.
          </p>
          
          <div className="mt-10 border-t border-gray-100 pt-8 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">وتفضلوا بقبول فائق الاحترام والتقدير،</p>
              <p className="font-black text-xl text-gray-900">فريق تأسيس {report.projectName}</p>
            </div>
            <div className="w-16 h-16 opacity-10 flex items-center justify-center print:hidden">
              <Trophy className="w-full h-full text-blue-900" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-gray-500 text-xs text-center">
        ⚠️ تنويه: هذا التقرير استرشادي ولا يعتبر مشورة قانونية أو مالية نهائية. يُوصى بالاستعانة بخبير مالي معتمد قبل اتخاذ قرارات استثمارية.
      </p>
    </div>
  );
}
