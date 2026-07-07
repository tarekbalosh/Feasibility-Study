import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';

const purposes = [
  'أختبر فكرتي',
  'أُقنع مموّلاً أو مستثمراً',
  'أدرس توسّع منشأتي',
  'أُعدّها لعميل'
];

export const getServerSideProps = async () => ({ props: {} });

export default function ProjectNameAndPurpose() {
  const { form } = useFeasibilityTool();
  const { register, watch, formState: { errors } } = form;
  const currentPurpose = watch('projectDetails.purpose');

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ما اسم مشروعك؟</h2>
        <p className="text-gray-500 mb-6">اكتبه ولو مبدئياً — سيتصدّر دراستك، وتغييره ممكن في أي وقت.</p>
        
        <div>
          <input
            {...register('projectDetails.projectName')}
            type="text"
            placeholder="مثال: مطعم بيت الرز"
            className={`w-full p-4 rounded-xl border-2 transition-colors focus:outline-none focus:ring-0 ${
              errors.projectDetails?.projectName 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-200 focus:border-indigo-500'
            }`}
          />
          {errors.projectDetails?.projectName && (
            <p className="mt-2 text-sm text-red-600">{errors.projectDetails.projectName.message}</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-800 mb-4">ما غايتك من هذه الدراسة؟ <span className="text-gray-400 text-sm font-normal">(اختياري — يساعدنا أن نُبرز ما يهمّك)</span></p>
        <div className="flex flex-wrap gap-3">
          {purposes.map((purpose) => (
            <label
              key={purpose}
              className={`cursor-pointer px-4 py-2 rounded-full border transition-all ${
                currentPurpose === purpose
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-indigo-300 text-gray-600'
              }`}
            >
              <input
                type="radio"
                value={purpose}
                {...register('projectDetails.purpose')}
                className="hidden"
              />
              {purpose}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
