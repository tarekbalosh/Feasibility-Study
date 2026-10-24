import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePlan } from '@/hooks/usePlans';
import { useToolRuns } from '@/hooks/useToolRuns';
import { Briefcase, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PlanSheet from '@/components/plans/PlanSheet';

export default function PlanDetails() {
  const router = useRouter();
  const { id } = router.query;
  const planId = typeof id === 'string' ? id : '';

  const { data: plan, isLoading: isLoadingPlan } = usePlan(planId, !!planId);
  const { data: toolRuns } = useToolRuns({ planId, enabled: !!planId });

  return (
    <DashboardLayout>
      <Head>
        <title>{plan ? `${plan.name} - تفاصيل الخطة` : 'تفاصيل الخطة'} - Feasibility Suite</title>
      </Head>

      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard/Plans" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors font-medium"
        >
          <ArrowRight size={16} /> العودة إلى الخطط التشغيلية
        </Link>
        
        {isLoadingPlan ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ) : plan ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {plan.status === 'active' ? 'نشطة' : plan.status}
                    </span>
                    {plan.department?.name && (
                      <>
                        <span>•</span>
                        <span>قسم: {plan.department.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {plan.description && (
                <p className="text-gray-600 text-sm mt-3 max-w-3xl leading-relaxed">{plan.description}</p>
              )}
            </div>
            <Link
              id="plan-browse-tools"
              href={`/tools?planId=${planId}`}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 transition-colors self-start"
            >
              تصفح الأدوات للبدء
            </Link>
          </div>
        ) : (
          <div className="text-red-500 font-medium">لم يتم العثور على الخطة.</div>
        )}
      </div>

      {/* الجدول الشامل بنمط Excel مباشرة بلا تبويبات وبلا بطاقات */}
      <div className="pb-16">
        <PlanSheet
          planId={planId}
          planName={plan?.name}
          departmentName={plan?.department?.name}
          members={(plan?.members ?? []).map((m: any) => ({ id: m.id, name: m.name }))}
          toolRunsCount={toolRuns?.length}
        />
      </div>
    </DashboardLayout>
  );
}
