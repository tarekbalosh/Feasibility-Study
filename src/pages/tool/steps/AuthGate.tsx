import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import apiClient from '@/lib/axios';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const getServerSideProps = async () => ({ props: {} });

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
      const newProjectId = res.data?.id;
      
      if (newProjectId) {
        setProjectId(newProjectId);
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
    if (!authLoading) {
      const pInfoName = form.getValues('projectInfo.projectName');
      const pDetailsName = form.getValues('projectDetails.projectName');
      
      if (!pInfoName && !pDetailsName) {
        // Form is empty (probably after clearDraft), just skip
        nextStep();
      } else if (projectId) {
        // Already linked, just proceed
        nextStep();
      } else if (isAuthenticated && !isLinking) {
        linkDraftToAccount();
      } else if (!isAuthenticated) {
        // If not authenticated, skip to Report so they can view it
        nextStep();
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
