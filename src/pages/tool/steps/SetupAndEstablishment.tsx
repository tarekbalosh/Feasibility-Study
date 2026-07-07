import React, { useEffect } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const defaultEquipments = ['تجهيزات المطبخ والمعدات', 'الأثاث والديكور الثابت', 'أجهزة الكاشير والشاشات', 'مركبة توصيل'];
const defaultExpenses = ['التراخيص والتصاريح', 'تصميم الهوية واللافتة', 'دفعة الإيجار المقدّمة', 'حملة الافتتاح'];

export default function SetupAndEstablishment() {
  const { form } = useFeasibilityTool();
  const { control, register, watch } = form;
  
  const investmentAmount = watch('investmentData.amount') || 0;
  
  const { fields: equipFields, append: appendEquip, remove: removeEquip } = useFieldArray({
    control, name: 'setupData.equipments',
  });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control, name: 'setupData.establishmentExpenses',
  });

  const equipments = watch('setupData.equipments') || [];
  const expenses = watch('setupData.establishmentExpenses') || [];
  
  const equipTotal = equipments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const expTotal = expenses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const grandTotal = equipTotal + expTotal;

  useEffect(() => {
    if (equipments.length === 0 && expenses.length === 0 && equipFields.length === 0 && expFields.length === 0) {
      defaultEquipments.forEach(name => appendEquip({ name, value: 0 }));
      defaultExpenses.forEach(name => appendExp({ name, value: 0 }));
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ماذا ستجهّز قبل الافتتاح؟</h2>
        <p className="text-gray-500">قسمان: تجهيزات وأصول تبقى ملكاً لمشروعك (معدات، أثاث…)، ومصاريف تأسيس تُدفع مرة واحدة ولا تعود (تراخيص، ديكور…). عبّئ ما يخصّك وتجاوز الباقي.</p>
      </div>

      <div className="space-y-10">
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold text-gray-800">التجهيزات والأصول</h3>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">المجموع: {equipTotal.toLocaleString()}</span>
          </div>
          <div className="space-y-3">
            {equipFields.map((field, index) => (
              <div key={field.id} className="flex gap-3">
                <input
                  {...register(`setupData.equipments.${index}.name`)}
                  placeholder="اسم التجهيز"
                  className="flex-1 p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-0"
                />
                <input
                  {...register(`setupData.equipments.${index}.value`, { valueAsNumber: true })}
                  type="number" min="0" placeholder="0"
                  className="w-32 p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-0"
                  dir="ltr"
                />
                <button type="button" onClick={() => removeEquip(index)} className="text-gray-400 hover:text-red-500 px-2">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          {equipFields.length < 15 && (
            <button type="button" onClick={() => appendEquip({ name: '', value: 0 })} className="mt-3 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
              <Plus className="w-4 h-4 mr-1" /> + أضف بنداً
            </button>
          )}
        </section>

        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold text-gray-800">مصاريف التأسيس</h3>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">المجموع: {expTotal.toLocaleString()}</span>
          </div>
          <div className="space-y-3">
            {expFields.map((field, index) => (
              <div key={field.id} className="flex gap-3">
                <input
                  {...register(`setupData.establishmentExpenses.${index}.name`)}
                  placeholder="اسم المصروف"
                  className="flex-1 p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-0"
                />
                <input
                  {...register(`setupData.establishmentExpenses.${index}.value`, { valueAsNumber: true })}
                  type="number" min="0" placeholder="0"
                  className="w-32 p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-0"
                  dir="ltr"
                />
                <button type="button" onClick={() => removeExp(index)} className="text-gray-400 hover:text-red-500 px-2">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          {expFields.length < 15 && (
            <button type="button" onClick={() => appendExp({ name: '', value: 0 })} className="mt-3 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
              <Plus className="w-4 h-4 mr-1" /> + أضف بنداً
            </button>
          )}
        </section>
      </div>

      <div className="mt-10 p-5 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg font-bold text-gray-900">المجموع الكلي للتجهيزات والتأسيس:</p>
          <p className="text-2xl font-bold text-indigo-600">{grandTotal.toLocaleString()}</p>
        </div>
        
        {grandTotal > 0 && (
          <p className="text-sm text-gray-500 mt-2 flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">ℹ️</span>
            سنحتسب إهلاك هذه التجهيزات آلياً ضمن مصاريفك الشهرية — هذه ليست مهمتك.
          </p>
        )}
        
        {grandTotal === 0 && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg flex items-start gap-2 text-sm font-medium border border-amber-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>أمتأكد؟ أغلب المشاريع تحتاج تجهيزات قبل الانطلاق — والمتابعة ممكنة على أي حال.</p>
          </div>
        )}
        
        {grandTotal > investmentAmount && investmentAmount > 0 && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg flex items-start gap-2 text-sm font-medium border border-amber-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>مجموع تجهيزاتك ({grandTotal.toLocaleString()}) أعلى من استثمارك ({investmentAmount.toLocaleString()}) — راجع أحدهما إن شئت، والمتابعة ممكنة.</p>
          </div>
        )}
      </div>
    </div>
  );
}
