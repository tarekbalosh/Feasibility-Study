import React, { useState, useEffect } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { Loader2 } from 'lucide-react';

export const getServerSideProps = async () => ({ props: {} });

export default function GenerationScreen() {
  const { form, nextStep } = useFeasibilityTool();
  const projectName = form.watch('projectDetails.projectName') || 'مشروعك';
  
  const messages = [
    'نجمع مدخلاتك ونبني هيكل الدراسة…',
    'نبني بيان الأرباح والخسائر — شهراً بشهر لثلاث سنوات…',
    'نتتبّع تدفقاتك النقدية عبر 36 شهراً…',
    'نحسب نقطة تعادلك: كم تبيع شهرياً — ويومياً — لتغطي تكاليفك…',
    'نقيس عائدك على الاستثمار وفترة استرداد رأس مالك…',
    'نفحص كفاية تمويلك شهراً بشهر…',
    `دراسة «${projectName}» جاهزة.`
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      nextStep();
    }, 7500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [nextStep, messages.length]);

  return (
    <div className="max-w-2xl mx-auto py-24 text-center">
      <div className="mb-10 flex justify-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
      </div>
      <div className="min-h-[80px] flex items-center justify-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 transition-opacity duration-500">
          {messages[currentMessageIndex]}
        </h2>
      </div>
      <div className="w-64 mx-auto mt-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
          style={{ width: `${((currentMessageIndex + 1) / messages.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
