import React from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

export interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isAnalyzing?: boolean;
  showPrev?: boolean;
  nextLabel?: string;
  disableNext?: boolean;
  hideButtons?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isAnalyzing = false,
  showPrev = true,
  nextLabel,
  disableNext = false,
  hideButtons = false,
}) => {
  if (currentStep === totalSteps || hideButtons) return null;

  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100" dir="rtl">
      {showPrev ? (
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStep === 1 || isAnalyzing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowRight size={20} />
          السابق
        </button>
      ) : <div />}
      <button
        type="button"
        onClick={onNext}
        disabled={isAnalyzing || disableNext}
        className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            جاري التحليل...
          </>
        ) : (
          <>
            {nextLabel || 'التالي'}
            <ArrowLeft size={20} />
          </>
        )}
      </button>
    </div>
  );
};
