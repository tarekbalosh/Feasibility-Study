import React from 'react';
import Head from 'next/head';
import { FeasibilityProvider, useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useAuth } from '@/context/AuthContext';
import { StepIndicator } from '@/components/tool/StepIndicator';
import { NavigationButtons } from '@/components/tool/NavigationButtons';

// Import Steps
import SectorSelection from './steps/SectorSelection';
import ProjectNameAndPurpose from './steps/ProjectNameAndPurpose';
import InitialInvestment from './steps/InitialInvestment';
import PartnersAndShares from './steps/PartnersAndShares';
import SetupAndEstablishment from './steps/SetupAndEstablishment';
import ExpectedSales from './steps/ExpectedSales';
import ItemsAndCosts from './steps/ItemsAndCosts';
import CommissionAndTax from './steps/CommissionAndTax';
import MonthlyExpenses from './steps/MonthlyExpenses';
import GenerationScreen from './steps/GenerationScreen';
import Analysis from './steps/Analysis';
import AuthGate from './steps/AuthGate';
import Report from './steps/Report';
import Export from './steps/Export';

const WizardContent = () => {
  const { currentStep, totalSteps, nextStep, prevStep, isAnalyzing, form } = useFeasibilityTool();
  const { isAuthenticated } = useAuth();
  
  const partners = form.watch('partnersData') || [];
  const totalPercentage = partners.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);

  let nextLabel = '';
  let disableNext = false;
  let hideButtons = false;

  if (currentStep === 1) {
    hideButtons = true;
  } else if (currentStep === 2) {
    nextLabel = 'ابدأ بناء الدراسة';
  } else if (currentStep === 3) {
    nextLabel = 'التالي: الشركاء';
  } else if (currentStep === 4) {
    nextLabel = 'التالي: التجهيزات';
    disableNext = totalPercentage !== 100;
  } else if (currentStep === 5) {
    nextLabel = 'التالي: المبيعات';
  } else if (currentStep === 6) {
    nextLabel = 'التالي: الأصناف وتكاليفها';
  } else if (currentStep === 7) {
    nextLabel = 'التالي: العمولة والضريبة';
  } else if (currentStep === 8) {
    nextLabel = 'الخطوة الأخيرة: مصاريفك الشهرية';
  } else if (currentStep === 9) {
    nextLabel = 'أنشئ دراستي';
  } else if (currentStep === 10) {
    hideButtons = true; // Generation Screen handles its own navigation
  } else if (currentStep === 11) {
    nextLabel = 'التالي: حفظ التقرير';
    disableNext = !isAuthenticated;
  } else if (currentStep === 12) {
    hideButtons = true; // Auth Gate handles its own logic and navigation
  } else if (currentStep === 13) {
    nextLabel = 'التالي: خيارات التصدير';
  } else if (currentStep === 14) {
    hideButtons = true; // Export screen has its own buttons
  }

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
            {currentStep === 1 && <SectorSelection />}
            {currentStep === 2 && <ProjectNameAndPurpose />}
            {currentStep === 3 && <InitialInvestment />}
            {currentStep === 4 && <PartnersAndShares />}
            {currentStep === 5 && <SetupAndEstablishment />}
            {currentStep === 6 && <ExpectedSales />}
            {currentStep === 7 && <ItemsAndCosts />}
            {currentStep === 8 && <CommissionAndTax />}
            {currentStep === 9 && <MonthlyExpenses />}
            {currentStep === 10 && <GenerationScreen />}
            {currentStep === 11 && <Analysis />}
            {currentStep === 12 && <AuthGate />}
            {currentStep === 13 && <Report />}
            {currentStep === 14 && <Export />}
          </div>

          <div className="print:hidden">
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrev={prevStep}
              isAnalyzing={isAnalyzing}
              nextLabel={nextLabel}
              disableNext={disableNext}
              hideButtons={hideButtons}
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
