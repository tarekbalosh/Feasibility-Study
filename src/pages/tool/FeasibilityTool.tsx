import React from 'react';
import Head from 'next/head';
import { FeasibilityProvider, useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { StepIndicator } from '@/components/tool/StepIndicator';
import { NavigationButtons } from '@/components/tool/NavigationButtons';

// Import Steps
import ProjectInfo from './steps/ProjectInfo';
import FinancialData from './steps/FinancialData';
import Analysis from './steps/Analysis';
import Report from './steps/Report';
import Export from './steps/Export';

const WizardContent = () => {
  const { currentStep, nextStep, prevStep, isAnalyzing } = useFeasibilityTool();

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <Head>
        <title>أداة دراسة الجدوى الذكية</title>
        <meta name="description" content="أداة متعددة الخطوات لإنشاء دراسة جدوى مبدئية" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 print:hidden">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">أداة دراسة الجدوى الذكية</h1>
          <p className="text-gray-500 text-lg">قم بإدخال بيانات مشروعك وسنقوم بتحليلها وتقديم تقرير مبدئي</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10 print:shadow-none print:border-none print:p-0">
          <div className="print:hidden">
            <StepIndicator />
          </div>
          
          <div className="min-h-[400px]">
            {currentStep === 1 && <ProjectInfo />}
            {currentStep === 2 && <FinancialData />}
            {currentStep === 3 && <Analysis />}
            {currentStep === 4 && <Report />}
            {currentStep === 5 && <Export />}
          </div>

          <div className="print:hidden">
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={5}
              onNext={nextStep}
              onPrev={prevStep}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeasibilityToolPage() {
  return (
    <FeasibilityProvider>
      <WizardContent />
    </FeasibilityProvider>
  );
}
