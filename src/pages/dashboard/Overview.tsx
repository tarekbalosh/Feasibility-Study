import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { TaskStatusDonutCard } from '@/components/dashboard/TaskStatusDonutCard';
import { YearBudgetDonutCard } from '@/components/dashboard/YearBudgetDonutCard';
import { GoalsProgressDonutCard } from '@/components/dashboard/GoalsProgressDonutCard';
import { DepartmentDrawer } from '@/components/departments/DepartmentDrawer';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/StatCard';
import {
  DepartmentsCardDetails,
  PlansCardDetails,
  MembersCardDetails,
  ProgressCardDetails,
} from '@/components/dashboard/StatCardDetails';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useOrgOverview } from '@/hooks/useOrg';
import {
  Building2,
  Briefcase,
  Users,
  TrendingUp,
  Activity,
  FolderOpen,
} from 'lucide-react';

export default function Overview() {
  const { isAuthenticated } = useAuth();
  const { workspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('SAR');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDepartment = (id: string) => {
    setSelectedDepartmentId(id);
    setIsDrawerOpen(true);
  };

  // يتم جلب البيانات لجميع أعضاء مساحة العمل بحسب صلاحياتهم المحسوبة في الخادم
  const { data: overview, isLoading, isError } = useOrgOverview(workspace?.id, isAuthenticated);

  if (isLoading || isWorkspaceLoading) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">الرئيسية</h1>
          <p className="mt-2 text-sm text-gray-500">تابع أداء الأقسام، الخطط التشغيلية، ومستجدات المشاريع.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 items-stretch" aria-busy="true">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !overview) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center text-red-500">
          حدث خطأ أثناء تحميل البيانات
        </div>
      </DashboardLayout>
    );
  }

  const stats = overview.stats || {
    departments: 0,
    activePlans: 0,
    members: 0,
    progress: 0,
  };
  const departments = overview.departments || [];
  const plans = overview.plans || [];
  const recentProjects = overview.recentProjects || [];

  return (
    <DashboardLayout>
      <Head>
        <title>الرئيسية - Feasibility Suite</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">الرئيسية</h1>
        <p className="mt-2 text-sm text-gray-500">تابع أداء الأقسام، الخطط التشغيلية، ومستجدات المشاريع.</p>
      </div>

      {/* 1) الرسوم الدائرية الثلاثة (في أعلى الصفحة، فوق كل شيء، في صف واحد وتتحول إلى عمود في الجوال) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <TaskStatusDonutCard data={overview.taskStatus} />
        <YearBudgetDonutCard
          data={overview.budgetYear}
          activeCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />
        <GoalsProgressDonutCard data={overview.goalsProgress} />
      </div>

      {/* 2) بطاقات الأرقام العلوية */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 items-stretch">
        <StatCard
          title="إجمالي الأقسام"
          value={stats.departments}
          icon={Building2}
          color="indigo"
        >
          <DepartmentsCardDetails
            departments={departments}
            onDepartmentClick={handleOpenDepartment}
            canCreateDepartment={workspace?.role === 'owner' || workspace?.role === 'admin'}
          />
        </StatCard>
        <StatCard
          title="الخطط النشطة"
          value={stats.activePlans}
          icon={Briefcase}
          color="emerald"
        >
          <PlansCardDetails plans={overview.activePlansList || []} />
        </StatCard>
        <StatCard
          title="أعضاء مساحة العمل"
          value={stats.members}
          icon={Users}
          color="amber"
        >
          <MembersCardDetails
            members={overview.membersPreview || []}
            total={stats.members}
            visibleUserIds={overview.visibleMemberUserIds || []}
          />
        </StatCard>
        <StatCard
          title="نسبة الإنجاز"
          value={`${Math.round(stats.progress || 0)}%`}
          icon={TrendingUp}
          color="blue"
        >
          <ProgressCardDetails
            overall={stats.progress || 0}
            departments={overview.departmentsProgress || []}
            onDepartmentClick={handleOpenDepartment}
          />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Departments & Plans) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Departments Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">الأقسام الرئيسية</h2>
            </div>
            {departments.length === 0 ? (
              <EmptyState 
                title="لا توجد أقسام" 
                description="أضف أقساماً جديدة لتنظيم فريقك." 
                actionText="إنشاء قسم"
                actionHref="/dashboard/Departments"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {departments.map((dept: any) => (
                  <div key={dept.id} className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-indigo-100/20 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{dept.name}</h3>
                        <p className="text-xs text-gray-500">{dept.membersCount} أعضاء • {dept.plansCount} خطط</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-gray-700">تقدم القسم</span>
                        <span className="font-bold text-indigo-600">{Math.round(dept.progress || 0)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${dept.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Plans Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">الخطط التشغيلية النشطة</h2>
            </div>
            {plans.length === 0 ? (
              <EmptyState 
                title="لا توجد خطط" 
                description="قم بإنشاء خطط للأقسام للبدء في العمل." 
                actionText="إنشاء خطة"
                actionHref="/dashboard/Plans"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {plans.map((plan: any) => (
                  <div key={plan.id} className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{plan.name}</h3>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                          {plan.status === 'active' ? 'نشط' : plan.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{plan.department?.name} • {plan.tasksCount} مهمة</p>
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${plan.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 w-8">{Math.round(plan.progress || 0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Recent Projects) */}
        <div className="space-y-8">
          <section className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="text-indigo-500" size={20} />
              أحدث المشاريع
            </h2>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">لا توجد مشاريع حديثة.</div>
            ) : (
              <div className="space-y-5">
                {recentProjects.map((proj: any) => (
                  <div key={proj.id} className="flex gap-4 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                      <FolderOpen size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{proj.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {proj.department?.name || 'بدون قسم'} • {new Date(proj.updatedAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* النافذة الجانبية لتفاصيل القسم تفتح بسلاسة من اليسار */}
      <DepartmentDrawer
        departmentId={selectedDepartmentId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </DashboardLayout>
  );
}

function EmptyState({ title, description, actionText, actionHref }: any) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200/50 mb-3">
        <FolderOpen size={24} className="text-gray-400" />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 mb-4">{description}</p>
      {actionText && actionHref && (
        <Link 
          href={actionHref}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
