import React, { useEffect } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export const getServerSideProps = async () => ({ props: {} });

export default function ItemsAndCosts() {
  const { form } = useFeasibilityTool();
  const { control, register, watch } = form;
  
  const sector = watch('sector');
  const title = sector === 'مطاعم وأغذية' ? 'ما أبرز أصناف قائمتك؟' : 'ما أبرز منتجاتك أو خدماتك؟';
  
  const { fields, append, remove } = useFieldArray({
    control, name: 'itemsData.items',
  });

  const items = watch('itemsData.items') || [];
  
  useEffect(() => {
    if (fields.length === 0) {
      for (let i = 0; i < 4; i++) {
        append({ name: '', cost: 0, price: 0 });
      }
    }
  }, []);

  const totalCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const costMargin = totalPrice > 0 ? Math.round((totalCost / totalPrice) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500">اذكر 3–5 من أهم أصنافك (والقالب يتسع لـ20). لكل صنف: كم يكلّفك إعداده، وكم تبيعه؟ ومن أرقامك سنشتق نسبة تكلفة موادك تلقائياً.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 text-center">
        <p className="text-sm font-medium text-indigo-800 mb-1">نسبة تكلفة موادك من كل عملية بيع</p>
        <p className="text-4xl font-black text-indigo-600 mb-2">{costMargin}%</p>
        <p className="text-xs text-indigo-500">حسبناها لك من مجموع تكاليف أصنافك ÷ مجموع أسعارها.</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex gap-2 sm:gap-3 px-2 text-xs sm:text-sm font-medium text-gray-500">
          <div className="flex-1">الصنف</div>
          <div className="w-20 sm:w-28 text-center">تكلفته</div>
          <div className="w-20 sm:w-28 text-center">سعر البيع</div>
          <div className="w-7 sm:w-8"></div>
        </div>
        {fields.map((field, index) => {
          const c = Number(items[index]?.cost) || 0;
          const p = Number(items[index]?.price) || 0;
          const warning = p > 0 && c >= p;
          
          return (
            <div key={field.id}>
              <div className="flex gap-2 sm:gap-3 items-center">
                <input
                  {...register(`itemsData.items.${index}.name`)}
                  placeholder="اسم الصنف"
                  className="flex-1 p-2.5 sm:p-3 text-sm rounded-lg border border-gray-200 focus:border-indigo-500"
                />
                <input
                  {...register(`itemsData.items.${index}.cost`, { valueAsNumber: true })}
                  type="number" min="0" placeholder="0"
                  className="w-20 sm:w-28 p-2.5 sm:p-3 text-sm text-center rounded-lg border border-gray-200 focus:border-indigo-500"
                  dir="ltr"
                />
                <input
                  {...register(`itemsData.items.${index}.price`, { valueAsNumber: true })}
                  type="number" min="0" placeholder="0"
                  className="w-20 sm:w-28 p-2.5 sm:p-3 text-sm text-center rounded-lg border border-gray-200 focus:border-indigo-500"
                  dir="ltr"
                />
                <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {warning && (
                <p className="text-xs text-amber-600 mt-1 font-medium flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 inline" /> تكلفة هذا الصنف تساوي سعره أو تتجاوزه — تربح منه شيئاً؟
                </p>
              )}
            </div>
          );
        })}
        {fields.length < 20 && (
          <button type="button" onClick={() => append({ name: '', cost: 0, price: 0 })} className="mt-3 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
            <Plus className="w-4 h-4 mr-1" /> أضف صنفاً
          </button>
        )}
      </div>

      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <label className="block text-sm font-medium text-gray-800 mb-2">نسبة المستلزمات المصاحبة لكل بيع (تغليف، أدوات تقديم…)</label>
        <div className="relative w-32 mb-2">
          <input
            {...register('itemsData.suppliesPercentage', { valueAsNumber: true })}
            type="number" min="0" max="100" placeholder="3"
            className="w-full p-3 rounded-lg border border-gray-200 focus:border-indigo-500 pr-8"
            dir="ltr"
          />
          <span className="absolute right-3 top-3 text-gray-400 font-bold">%</span>
        </div>
        <p className="text-xs text-gray-500">إن لم ينطبق على مشروعك اجعلها صفراً.</p>
      </div>
    </div>
  );
}
