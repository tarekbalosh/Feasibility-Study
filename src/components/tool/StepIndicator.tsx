import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, name: 'معلومات المشروع' },
  { id: 2, name: 'البيانات المالية' },
  { id: 3, name: 'تحليل البيانات' },
  { id: 4, name: 'التقرير' },
  { id: 5, name: 'تصدير' },
];

export const StepIndicator = () => {
  const { currentStep } = useFeasibilityTool();

  return (
    <div className="w-full py-6 mb-8" dir="rtl">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 rounded-full" />
        <div 
          className="absolute right-0 top-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm
                  ${isCompleted ? 'bg-blue-600 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
              >
                {isCompleted ? <Check size={20} /> : step.id}
              </div>
              <span className={`text-xs md:text-sm font-medium ${isCurrent || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
