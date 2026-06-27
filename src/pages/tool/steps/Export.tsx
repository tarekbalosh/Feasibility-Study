import React, { useState } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { Download, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Report from './Report';

export default function Export() {
  const { prevStep, form, projectId } = useFeasibilityTool();
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    // Give state a moment to update before opening print dialog
    setTimeout(() => {
      window.print(); // Browser's print dialog will handle PDF export
      setIsDownloading(false);
    }, 500);
  };

  const handleSaveToAccount = async () => {
    if (!isAuthenticated) {
      toast.error('يرجى تسجيل الدخول أولاً لحفظ دراسة الجدوى في حسابك.');
      router.push('/auth/login');
      return;
    }

    try {
      setIsSaving(true);
      const data = form.getValues();
      
      const desc = data?.projectInfo?.description || '';
      const validDesc = desc.length >= 10 ? desc : (desc + ' (تم إنشاء هذا المشروع من خلال الأداة).');
      const capital = Number(data?.financialData?.initialCapital);

      const payload = {
        name: data?.projectInfo?.projectName || 'مشروع جديد',
        industry: data?.projectInfo?.activityType || 'آخر',
        location: 'غير محدد',
        targetCapital: capital > 0 ? capital : 1000,
        durationYears: 3,
        description: validDesc,
        financialInputs: {
          monthlyOperatingCosts: Number(data?.financialData?.monthlyOperatingCosts) || 0,
          expectedMonthlyRevenue: Number(data?.financialData?.expectedMonthlyRevenue) || 0
        }
      };

      if (projectId) {
        await axios.put('/projects/' + projectId, payload);
        toast.success('تم تحديث دراسة الجدوى بنجاح في حسابك!');
      } else {
        await axios.post('/projects', payload);
        toast.success('تم حفظ دراسة الجدوى بنجاح في حسابك!');
      }
      
      setIsSaved(true);
      sessionStorage.removeItem('feasibilityToolData');
      sessionStorage.removeItem('feasibilityToolStep');
      
      // Navigate to Dashboard Projects page after a short delay
      setTimeout(() => {
        router.push('/dashboard/Projects');
      }, 1000);
      
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error?.message || 
        'حدث خطأ أثناء حفظ دراسة الجدوى. حاول مرة أخرى.'
      );
    } finally {
      setIsSaving(false);
    }
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
            لقد قمنا بإعداد تقرير مبدئي لمشروعك. يمكنك الآن تحميل التقرير أو حفظه في حسابك للعودة إليه لاحقاً.
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
              onClick={handleSaveToAccount}
              disabled={isSaved || isSaving}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold transition-colors shadow-sm ${
                isSaved 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              } disabled:opacity-70`}
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 size={20} />
              ) : (
                <Save size={20} />
              )}
              {isSaving ? 'جاري الحفظ...' : isSaved ? 'تم الحفظ بنجاح' : 'حفظ في حسابي'}
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
        <Report />
      </div>
    </>
  );
}
