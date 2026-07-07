import React, { useState } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { Download, Save, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/router';
import Report from './Report';

export const getServerSideProps = async () => ({ props: {} });

export default function Export() {
  const { prevStep, clearDraft } = useFeasibilityTool();
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    // Give state a moment to update before opening print dialog
    setTimeout(() => {
      window.print(); // Browser's print dialog will handle PDF export
      setIsDownloading(false);
    }, 500);
  };

  const handleReturnToDashboard = () => {
    clearDraft(false); // Ensure draft is cleared just in case
    router.push('/dashboard/Projects');
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden" dir="rtl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">اكتملت دراسة الجدوى المبدئية بنجاح!</h2>
          <p className="text-gray-500 max-w-lg mx-auto mb-10 text-lg">
            لقد قمنا بإعداد تقرير مبدئي لمشروعك وتم حفظه في حسابك بنجاح. يمكنك الآن تحميل التقرير أو العودة للوحة التحكم.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-70"
            >
              <Download size={20} />
              {isDownloading ? 'جاري التحضير...' : 'تحميل بصيغة PDF'}
            </button>

            <button
              onClick={handleReturnToDashboard}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold transition-colors shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              <Save size={20} />
              العودة للوحة التحكم
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
            <button
              onClick={prevStep}
              className="text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
              العودة لمراجعة التقرير
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Report for Printing */}
      <div className="hidden print:block" dir="rtl">
        <Report forPrint={true} />
      </div>
    </>
  );
}
