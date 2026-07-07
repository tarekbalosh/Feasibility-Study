import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';

const progressMap: Record<number, number> = {
  1: 12,
  2: 18,
  3: 26,
  4: 34,
  5: 42,
  6: 50,
  7: 58,
  8: 66,
  9: 74,
  10: 100,
  11: 100,
  12: 100,
  13: 100,
};

export const StepIndicator = () => {
  const { currentStep } = useFeasibilityTool();
  const percentage = progressMap[currentStep] || 0;

  return (
    <div className="w-full mb-8" dir="rtl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">تقدمك</span>
        <span className="text-sm font-bold text-indigo-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
