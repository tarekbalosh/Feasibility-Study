import React, { useEffect } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const defaultExpensesList = ['الرواتب الشهرية', 'الإيجار الشهري', 'الكهرباء والماء', 'الإعلان والتسويق', 'الإنترنت والاشتراكات', 'الصيانة والنظافة'];

export const getServerSideProps = async () => ({ props: {} });

export default function MonthlyExpenses() {
  const { form, projectDetails } = useFeasibilityTool();
  const { control, register, watch } = form;
  
  const projectName = projectDetails?.projectName || 'مشروعك';
  
  const equipments = watch('setupData.equipments') || [];
  const startExpenses = watch('setupData.establishmentExpenses') || [];
  const equipTotal = equipments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const expTotal = startExpenses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const grandTotalSetup = equipTotal + expTotal;
  const depreciation = Math.round(grandTotalSetup / 36);
  
  const { fields, append, remove } = useFieldArray({
    control, name: 'monthlyExpensesData.expenses',
  });

  const expenses = watch('monthlyExpensesData.expenses') || [];
  const currentExpensesTotal = expenses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const totalMonthly = currentExpensesTotal + depreciation;

  useEffect(() => {
    if (fields.length === 0) {
      defaultExpensesList.forEach(name => append({ name, value: 0 }));
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ما مصاريف «{projectName}» الشهرية الثابتة؟</h2>
        <p className="text-gray-500">ما يتكرّر كل شهر سواء بعتَ أم لم تبِع: رواتب، إيجار، كهرباء… عبّئ ما ينطبق وتجاوز الباقي — هذه خطوتك الأخيرة.</p>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex gap-2 sm:gap-3 px-2 text-xs sm:text-sm font-medium text-gray-500">
          <div className="flex-1">اسم المصروف</div>
          <div className="w-24 sm:w-32 text-center">القيمة الشهرية</div>
          <div className="w-7 sm:w-8"></div>
        </div>
        
        {/* Auto depreciation row */}
        <div className="flex gap-2 sm:gap-3 items-center opacity-80">
          <div className="flex-1 p-2.5 sm:p-3 text-sm bg-gray-100 rounded-lg border border-gray-200 text-gray-600 font-medium flex items-center justify-between">
            <span className="truncate pr-1">إهلاك التجهيزات والتأسيس</span>
            <span className="hidden sm:inline-block text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">يُحتسب آلياً</span>
          </div>
          <div className="w-24 sm:w-32 p-2.5 sm:p-3 text-sm bg-gray-100 rounded-lg border border-gray-200 text-center font-bold text-gray-700" dir="ltr">
            {depreciation.toLocaleString()}
          </div>
          <div className="w-7 sm:w-8"></div>
        </div>
        {grandTotalSetup > 0 && (
          <p className="text-xs text-gray-500 mt-1 pr-2 mb-3">حسبناه عنك: مجموع تجهيزاتك وتأسيسك ({grandTotalSetup.toLocaleString()}) موزّعاً على 36 شهراً.</p>
        )}

        {/* Dynamic rows */}
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 sm:gap-3 items-center">
            <input
              {...register(`monthlyExpensesData.expenses.${index}.name`)}
              placeholder="اسم المصروف"
              className="flex-1 p-2.5 sm:p-3 text-sm rounded-lg border border-gray-200 focus:border-indigo-500"
            />
            <input
              {...register(`monthlyExpensesData.expenses.${index}.value`, { valueAsNumber: true })}
              type="number" min="0" placeholder="0"
              className="w-24 sm:w-32 p-2.5 sm:p-3 text-sm text-center rounded-lg border border-gray-200 focus:border-indigo-500 font-medium"
              dir="ltr"
            />
            <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 px-1 sm:px-1.5 flex-shrink-0">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        ))}
        
        {fields.length < 19 && (
          <button type="button" onClick={() => append({ name: '', value: 0 })} className="mt-3 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
            <Plus className="w-4 h-4 mr-1" /> أضف مصروفاً
          </button>
        )}
      </div>

      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex justify-between items-center mb-1">
          <p className="text-lg font-bold text-gray-900">إجمالي المصاريف الشهرية:</p>
          <p className="text-2xl font-black text-indigo-700">{totalMonthly.toLocaleString()}</p>
        </div>
        
        {currentExpensesTotal === 0 && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg flex items-start gap-2 text-sm font-medium border border-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>مشروع بلا أي مصروف شهري (عدا الإهلاك) نادر جداً — أواصل على هذا؟</p>
          </div>
        )}
      </div>
    </div>
  );
}
