import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import apiClient from '@/lib/axios';
import { Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AuthGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { form, projectId, setProjectId, nextStep, clearDraft } = useFeasibilityTool();
  const router = useRouter();
  
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkDraftToAccount = async () => {
    setIsLinking(true);
    setError(null);
    try {
      const formValues = form.getValues();
      const desc = formValues.projectInfo?.description || formValues.projectDetails?.purpose || '';
      const validDesc = desc.length >= 10 ? desc : (desc + ' (تم إنشاء هذا المشروع من خلال الأداة).');

      const payload = {
        name: formValues.projectInfo?.projectName || formValues.projectDetails?.projectName || 'مشروع جديد',
        industry: formValues.sector || 'غير محدد',
        location: 'غير محدد',
        targetCapital: formValues.financialData?.initialCapital || 1000,
        description: validDesc,
        financialInputs: formValues, // Send all tool data
      };

      const { data: res } = await apiClient.post('/projects', payload);
      const projectId = res.data?.id;
      
      if (projectId) {
        setProjectId(projectId);
        // Clear the draft from localStorage now that it's in the DB (without resetting tool state)
        clearDraft(false);
        // Advance to Report step (Step 13)
        nextStep();
      } else {
        throw new Error('لم يتم إرجاع معرف المشروع من الخادم.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'حدث خطأ أثناء حفظ التقرير في حسابك.'
      );
    } finally {
      setIsLinking(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isLinking) {
      const pInfoName = form.getValues('projectInfo.projectName');
      const pDetailsName = form.getValues('projectDetails.projectName');
      
      if (!pInfoName && !pDetailsName) {
        // Form is empty (probably after clearDraft), just skip
        nextStep();
      } else if (projectId) {
        // Already linked, just proceed
        nextStep();
      } else {
        linkDraftToAccount();
      }
    }
  }, [isAuthenticated, authLoading, projectId]);

  if (authLoading || isLinking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLinking ? 'جارِ حفظ دراستك في حسابك...' : 'جاري التحقق من حالة الدخول...'}
          </h2>
          <p className="text-gray-500">
            يرجى الانتظار لحظات
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 animate-fade-in max-w-lg mx-auto">
        <div>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            اكتملت دراستك بنجاح!
          </h2>
          <p className="text-gray-600 leading-relaxed">
            لحفظ التقرير والوصول إليه لاحقاً، يرجى تسجيل الدخول أو إنشاء حساب مجاني. ستبقى بياناتك الحالية محفوظة ومتاحة فور تسجيلك.
          </p>
        </div>

        <div className="flex flex-col w-full space-y-4">
          <Link href="/auth/register?returnTo=/tool/FeasibilityTool" passHref>
            <Button className="w-full py-4 text-lg flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
              <UserPlus className="w-5 h-5" />
              أنشئ حساباً مجانياً
            </Button>
          </Link>
          
          <Link href="/auth/login?returnTo=/tool/FeasibilityTool" passHref>
            <Button variant="outline" className="w-full py-4 text-lg flex items-center justify-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <LogIn className="w-5 h-5" />
              لدي حساب بالفعل
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state if linking failed
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            فشل في حفظ التقرير
          </h2>
          <p className="text-red-600 mb-6 bg-red-50 p-4 rounded-lg">
            {error}
          </p>
          <Button
            onClick={linkDraftToAccount}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
