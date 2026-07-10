import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';

export const getServerSideProps = async () => ({ props: {} });

export default function CommissionAndTax() {
  const { form } = useFeasibilityTool();
  const { register, formState: { errors } } = form;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">هل تدفع عمولة على مبيعاتك؟ وما نسبة الضريبة؟</h2>
        <p className="text-gray-500">سؤالان سريعان — وكثير من المشاريع تجيب: صفر.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <label className="block text-lg font-bold text-gray-900 mb-2">عمولة البيع أو التحصيل</label>
          <div className="relative w-full md:w-1/2 mb-2">
            <input
              {...register('commissionTaxData.commissionRate', { valueAsNumber: true })}
              type="number" min="0" max="100" placeholder="0"
              className={`w-full p-4 text-xl rounded-xl border-2 focus:ring-0 pr-10 ${errors.commissionTaxData?.commissionRate ? 'border-red-300' : 'border-gray-200 focus:border-indigo-500'}`}
              dir="ltr"
              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
              onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
            />
            <span className="absolute right-4 top-4 text-gray-400 font-bold text-xl">%</span>
          </div>
          <p className="text-sm text-gray-500">مثل عمولة تطبيقات التوصيل أو أجهزة الدفع أو المندوبين — تُخصم من كل عملية بيع. لا عمولة؟ اكتب صفراً.</p>
          {errors.commissionTaxData?.commissionRate && <p className="text-sm text-red-500 mt-1">اكتب نسبة أو صفراً — كي لا نفترض عنك.</p>}
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <label className="block text-lg font-bold text-gray-900 mb-2">الضريبة على المبيعات</label>
          <div className="relative w-full md:w-1/2 mb-2">
            <input
              {...register('commissionTaxData.taxRate', { valueAsNumber: true })}
              type="number" min="0" max="100" placeholder="0"
              className={`w-full p-4 text-xl rounded-xl border-2 focus:ring-0 pr-10 ${errors.commissionTaxData?.taxRate ? 'border-red-300' : 'border-gray-200 focus:border-indigo-500'}`}
              dir="ltr"
              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
              onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
            />
            <span className="absolute right-4 top-4 text-gray-400 font-bold text-xl">%</span>
          </div>
          <p className="text-sm text-gray-500">النسبة المطبّقة في بلدك على مبيعات مشروعك. غير متأكد؟ ضعها صفراً الآن وعدّلها متى شئت — دراستك لن تضيع.</p>
          {errors.commissionTaxData?.taxRate && <p className="text-sm text-red-500 mt-1">اكتب نسبة أو صفراً — كي لا نفترض عنك.</p>}
        </div>
      </div>
    </div>
  );
}
