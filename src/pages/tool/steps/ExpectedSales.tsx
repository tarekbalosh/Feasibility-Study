import React, { useState } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { ChevronDown, ChevronUp } from 'lucide-react';

const months = ['الشهر 1', 'الشهر 2', 'الشهر 3', 'الشهر 4', 'الشهر 5', 'الشهر 6', 'الشهر 7', 'الشهر 8', 'الشهر 9', 'الشهر 10', 'الشهر 11', 'الشهر 12'];

export default function ExpectedSales() {
  const { form, projectDetails } = useFeasibilityTool();
  const { register, watch, setValue, formState: { errors } } = form;
  
  const projectName = projectDetails?.projectName || 'مشروعك';
  
  const [showGrid, setShowGrid] = useState(false);
  
  const firstYearAverage = watch('salesData.firstYearAverage') || 0;
  const monthlyGrid = watch('salesData.monthlyGrid') || Array(12).fill(0);

  const handleGridToggle = () => {
    if (!showGrid && firstYearAverage > 0) {
      setValue('salesData.monthlyGrid', Array(12).fill(firstYearAverage));
    }
    setShowGrid(!showGrid);
  };

  const emptyMonths = monthlyGrid.filter(v => !v || v === 0).length;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">كم تتوقّع أن يبيع «{projectName}» شهرياً؟</h2>
        <p className="text-gray-500">قدّر بواقعية لا بتفاؤل — الدراسة تحميك حين تَصدُقها.</p>
      </div>

      <div className="space-y-8">
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">مبيعات السنة الأولى</h3>
          
          {!showGrid ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">متوسط مبيعاتك الشهرية المتوقعة</label>
              <input
                {...register('salesData.firstYearAverage', { valueAsNumber: true })}
                type="number" min="0" placeholder="0"
                className={`w-full p-4 text-xl font-bold rounded-xl border-2 focus:ring-0 ${errors.salesData?.firstYearAverage ? 'border-red-300' : 'border-gray-200 focus:border-indigo-500'}`}
                dir="ltr"
              />
              <p className="text-sm text-gray-500 mt-2">سنعتمد هذا المتوسط لأشهر سنتك الأولى الاثني عشر.</p>
              {errors.salesData?.firstYearAverage && <p className="text-sm text-red-500 mt-1">{errors.salesData.firstYearAverage.message}</p>}
            </div>
          ) : (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {months.map((month, i) => (
                  <div key={i}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{month}</label>
                    <input
                      {...register(`salesData.monthlyGrid.${i}`, { valueAsNumber: true })}
                      type="number" min="0" placeholder="0"
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 text-center"
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>
              {emptyMonths > 0 && (
                <p className="text-sm text-amber-600 font-medium mt-3">تركت {emptyMonths} أشهر فارغة — سنعدّها بلا مبيعات. أأكمل؟</p>
              )}
            </div>
          )}
          
          <button type="button" onClick={handleGridToggle} className="text-indigo-600 font-medium text-sm flex items-center hover:text-indigo-800">
            {showGrid ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {showGrid ? 'العودة للمتوسط المبسط' : 'أدخِل شهراً بشهر (أدقّ)'}
            {!showGrid && <span className="text-gray-400 font-normal ml-2">البدايات غالباً أهدأ — عدّل الأشهر الأولى إن شئت.</span>}
          </button>
        </div>

        <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">نموّ المبيعات للسنوات القادمة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نموّ السنة الثانية عن الأولى (%)</label>
              <div className="relative">
                <input
                  {...register('salesData.growthRateYear2', { valueAsNumber: true })}
                  type="number" min="0" placeholder="0"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-0 pr-8"
                  dir="ltr"
                />
                <span className="absolute right-3 top-3 text-gray-400 font-bold">%</span>
              </div>
              {errors.salesData?.growthRateYear2 && <p className="text-sm text-red-500 mt-1">{errors.salesData.growthRateYear2.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نموّ السنة الثالثة عن الأولى (%)</label>
              <div className="relative">
                <input
                  {...register('salesData.growthRateYear3', { valueAsNumber: true })}
                  type="number" min="0" placeholder="0"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-0 pr-8"
                  dir="ltr"
                />
                <span className="absolute right-3 top-3 text-gray-400 font-bold">%</span>
              </div>
              {errors.salesData?.growthRateYear3 && <p className="text-sm text-red-500 mt-1">{errors.salesData.growthRateYear3.message}</p>}
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium">النسبتان تقاسان عن السنة الأولى — مثال: 20% للثانية و50% للثالثة تعنيان أن الثالثة أعلى من الأولى بمرة ونصف.</p>
        </div>
      </div>
    </div>
  );
}
