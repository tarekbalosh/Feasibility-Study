import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';

const currencies = ['ر.ع', 'د.إ', 'ر.س', 'د.ك', '$'];

export const getServerSideProps = async () => ({ props: {} });

export default function InitialInvestment() {
  const { form } = useFeasibilityTool();
  const { register, watch, setValue, formState: { errors } } = form;
  
  const amount = watch('investmentData.amount');
  const currency = watch('investmentData.currency') || 'ر.ع';
  const projectName = watch('projectDetails.projectName') || 'مشروعك';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const numValue = Number(rawValue);
    if (!isNaN(numValue) && rawValue !== '') {
      setValue('investmentData.amount', numValue, { shouldValidate: true });
    } else if (e.target.value === '') {
      setValue('investmentData.amount', undefined as any, { shouldValidate: true });
    }
  };

  const displayAmount = amount ? amount.toLocaleString('en-US') : '';

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">كم ستستثمر لإطلاق «{projectName}»؟</h2>
        <p className="text-gray-500">المبلغ الإجمالي الذي ستضعه أنت وشركاؤك لانطلاق المشروع. تقديرك الحالي يكفي — الدراسة ستُظهر لك لاحقاً إن كان كافياً.</p>
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder="0"
          className={`w-full p-4 text-2xl font-bold rounded-xl border-2 transition-colors focus:outline-none focus:ring-0 pl-24 ${
            errors.investmentData?.amount
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-200 focus:border-indigo-500'
          }`}
          dir="ltr"
        />
        <div className="absolute left-2 flex items-center h-full py-2">
          <select
            {...register('investmentData.currency')}
            className="h-full bg-gray-50 border-none rounded-lg text-gray-700 font-medium focus:ring-0 cursor-pointer px-2"
          >
            {currencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      {errors.investmentData?.amount && (
        <p className="mt-2 text-sm text-red-600">{errors.investmentData.amount.message}</p>
      )}
    </div>
  );
}
