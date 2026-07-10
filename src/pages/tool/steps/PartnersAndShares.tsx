import React, { useEffect } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

export const getServerSideProps = async () => ({ props: {} });

export default function PartnersAndShares() {
  const { form } = useFeasibilityTool();
  const { control, register, watch, formState: { errors }, setValue, getValues } = form;
  
  const projectName = watch('projectDetails.projectName') || 'مشروعك';
  const investmentAmount = watch('investmentData.amount') || 0;
  const currency = watch('investmentData.currency') || 'ر.ع';
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'partnersData',
  });

  const partners = watch('partnersData') || [];
  const totalPercentage = partners.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);

  useEffect(() => {
    if (fields.length === 0) {
      append({ name: 'أنا', percentage: 100 });
    } else {
      const currentPartners = getValues('partnersData');
      if (currentPartners && currentPartners.length > 0 && currentPartners[0].name === 'أنا (صاحب المشروع)') {
        setValue('partnersData.0.name', 'أنا');
      }
    }
  }, [fields.length, append, getValues, setValue]);

  const isTotal100 = totalPercentage === 100;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">من الشركاء في «{projectName}»؟</h2>
        <p className="text-gray-500">إن كنت وحدك فأنت الشريك الوحيد بنسبة 100%. أضف شركاءك وحدّد نسبة كل واحد — المجموع يجب أن يبلغ 100% تماماً.</p>
      </div>

      <div className="space-y-4 mb-6">
        {fields.map((field, index) => {
          const partnerPercent = Number(partners[index]?.percentage) || 0;
          const partnerShare = (investmentAmount * (partnerPercent / 100)).toLocaleString('en-US');
          
          return (
            <div key={field.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl relative">
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {index === 0 ? 'انا صاحب المشروع' : 'اسم الشريك'}
                  </label>
                  <input
                    {...register(`partnersData.${index}.name`)}
                    type="text"
                    placeholder="مثال: مستثمر، أخي..."
                    className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-0"
                  />
                  {errors.partnersData?.[index]?.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.partnersData[index]?.name?.message}</p>
                  )}
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">النسبة (%)</label>
                  <div className="relative">
                    <input
                      {...register(`partnersData.${index}.percentage`, { 
                        valueAsNumber: true,
                        onChange: (e) => {
                          const newValue = Number(e.target.value) || 0;
                          const currentPartners = getValues('partnersData') || [];
                          
                          if (index !== 0) {
                            let sumOthers = 0;
                            currentPartners.forEach((p: any, i: number) => {
                              if (i !== 0 && i !== index) sumOthers += (Number(p.percentage) || 0);
                            });
                            
                            let allowedValue = newValue;
                            if (sumOthers + newValue > 100) {
                              allowedValue = 100 - sumOthers;
                              setValue(`partnersData.${index}.percentage`, allowedValue, { shouldValidate: true });
                            }
                            
                            const newOwnerShare = Math.max(0, 100 - sumOthers - allowedValue);
                            setValue(`partnersData.0.percentage`, newOwnerShare, { shouldValidate: true });
                          } else {
                            let sumOthers = 0;
                            currentPartners.forEach((p: any, i: number) => {
                              if (i !== 0) sumOthers += (Number(p.percentage) || 0);
                            });
                            
                            if (sumOthers + newValue > 100) {
                              setValue(`partnersData.0.percentage`, 100 - sumOthers, { shouldValidate: true });
                            }
                          }
                        }
                      })}
                      type="number"
                      min="0"
                      max="100"
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-0 pr-8"
                      dir="ltr"
                      onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                      onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500 font-medium">
                  حصته من الاستثمار: <span className="text-indigo-600 font-bold">{partnerShare} {currency}</span>
                </p>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {fields.length < 4 ? (
        <button
          type="button"
          onClick={() => append({ name: '', percentage: 0 })}
          className="flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <Plus className="w-5 h-5 ml-1" />
          + أضف شريكاً
        </button>
      ) : (
        <p className="text-amber-600 text-sm font-medium">قالب الدراسة الحالي يستوعب حتى 4 شركاء.</p>
      )}

      <div className={`mt-8 p-4 rounded-xl border ${isTotal100 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center">
          <p className={`font-bold text-lg ${isTotal100 ? 'text-green-700' : 'text-red-700'}`}>
            مجموع النِسب: {totalPercentage}%
          </p>
          {!isTotal100 && (
            <p className="text-sm text-red-600">
              {totalPercentage < 100 
                ? `بقيت ${100 - totalPercentage}% لتوزيعها.`
                : `المجموع تجاوز 100% بـ${totalPercentage - 100}% — خفّف إحدى النِسب.`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
