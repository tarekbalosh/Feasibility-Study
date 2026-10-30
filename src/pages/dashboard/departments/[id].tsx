import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useDepartment } from '@/hooks/useDepartments';
import { DEPARTMENT_COLOR_MAP } from '@/components/departments/DepartmentDrawer';
import { DepartmentTasksFilters } from '@/components/departments/DepartmentTasksFilters';
import {
  Building2,
  ArrowRight,
  ShieldAlert,
  Users,
  Briefcase,
  CheckCircle2,
  Coins,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Plus,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const departmentId = typeof id === 'string' ? id : null;

  // استخراج الفلاتر الحالية من رابط الصفحة (Query Params)
  const rawStatus = router.query.status;
  const statusFilter = useMemo(() => {
    if (!rawStatus) return [];
    if (Array.isArray(rawStatus)) return rawStatus.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean);
    return rawStatus.split(',').map((s) => s.trim()).filter(Boolean);
  }, [rawStatus]);

  const rawAssignee = router.query.assignee;
  const assigneeFilter = useMemo(() => {
    if (!rawAssignee) return [];
    if (Array.isArray(rawAssignee)) return rawAssignee.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean);
    return rawAssignee.split(',').map((s) => s.trim()).filter(Boolean);
  }, [rawAssignee]);

  const planIdFilter = typeof router.query.planId === 'string' ? router.query.planId : '';
  const searchQuery =
    typeof router.query.search === 'string'
      ? router.query.search
      : typeof router.query.q === 'string'
      ? router.query.q
      : '';
  const currentPage = Math.max(1, Number(router.query.page) || 1);

  // المعاملات الممررة للـ API
  const filterParams = useMemo(
    () => ({
      status: statusFilter.length > 0 ? statusFilter.join(',') : undefined,
      assignee: assigneeFilter.length > 0 ? assigneeFilter.join(',') : undefined,
      planId: planIdFilter || undefined,
      search: searchQuery.trim() || undefined,
      page: currentPage,
      limit: 20,
    }),
    [statusFilter, assigneeFilter, planIdFilter, searchQuery, currentPage]
  );

  const { data: department, isLoading, isError, error } = useDepartment(departmentId, filterParams);

  const isForbidden = (error as any)?.response?.status === 403;
  const isNotFound = (error as any)?.response?.status === 404;

  const colorScheme =
    (department?.color && DEPARTMENT_COLOR_MAP[department.color]) || DEPARTMENT_COLOR_MAP.indigo;

  // تحديث رابط الصفحة عند تغيير الفلاتر
  const updateFiltersInUrl = (updates: Record<string, any>) => {
    const nextQuery: Record<string, any> = { ...router.query };

    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        delete nextQuery[key];
      } else if (Array.isArray(val)) {
        nextQuery[key] = val.join(',');
      } else {
        nextQuery[key] = String(val);
      }
    }

    // إعادة الصفحة للأولى عند تغيير الفلاتر ما لم يتم تغيير الصفحة صراحة
    if (!('page' in updates)) {
      delete nextQuery.page;
    }

    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  };

  const handleClearAllFilters = () => {
    const nextQuery: Record<string, any> = { id: router.query.id };
    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  };

  const hasActiveFilters = Boolean(
    statusFilter.length > 0 || assigneeFilter.length > 0 || planIdFilter || searchQuery.trim()
  );

  return (
    <DashboardLayout>
      <Head>
        <title>{department?.name ? `${department.name} - الأقسام` : 'تفاصيل القسم'} - Feasibility Suite</title>
      </Head>

      {/* حالة التحميل (Skeleton) */}
      {isLoading && !department ? (
        <DepartmentPageSkeleton />
      ) : isForbidden ? (
        /* شاشة الخطأ 403 */
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm" dir="rtl">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 mb-5 border border-amber-200/60 shadow-inner">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ليس لديك صلاحية</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-6">
            عذراً، هذا القسم مخصص لأعضاء معينين أو المشرفين فقط، ولا يملك حسابك صلاحية الاطلاع على بياناته أو تفاصيله.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/Departments"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <ArrowRight size={16} />
              العودة إلى قائمة الأقسام
            </Link>
          </div>
        </div>
      ) : isNotFound || isError || !department ? (
        /* شاشة الخطأ 404 */
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm" dir="rtl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-4 border border-red-100">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">القسم غير موجود</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm mb-6">
            لم نتمكن من العثور على القسم المطلوب. قد يكون قد تم حذفه أو تم تغيير الرابط.
          </p>
          <Link
            href="/dashboard/Departments"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowRight size={16} />
            العودة للأقسام
          </Link>
        </div>
      ) : (
        /* المحتوى الكامل للقسم */
        <div className="space-y-8" dir="rtl">
          
          {/* رأس الصفحة الرئيسي للقسم */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} shadow-sm`}
                >
                  <Building2 size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{department.name}</h1>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${colorScheme.dot}`} />
                      قسم نشط
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
                    {department.description || 'لا يوجد وصف متاح لهذا القسم.'}
                  </p>
                </div>
              </div>

              {/* معلومات رئيس القسم إن وُجد */}
              <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 rounded-2xl p-3.5 pr-4 shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm shadow-inner">
                  {department.head?.name ? department.head.name.slice(0, 2).toUpperCase() : <User size={20} />}
                </div>
                <div>
                  <span className="text-[11px] font-medium text-gray-400 block">رئيس القسم</span>
                  <span className="text-sm font-bold text-gray-900 block">
                    {department.head?.name || 'لم يُحدد رئيس'}
                  </span>
                  {department.head?.email && (
                    <span className="text-xs text-gray-500 font-mono block">{department.head.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* بطاقات المؤشرات الرئيسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="rounded-2xl bg-gray-50/70 p-4 border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium">عدد الأعضاء</span>
                  <Users size={16} className="text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{department.membersCount || 0}</p>
                <span className="text-[11px] text-gray-400">عضو مسجل بالقسم</span>
              </div>

              <div className="rounded-2xl bg-gray-50/70 p-4 border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium">الخطط التشغيلية</span>
                  <Briefcase size={16} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{department.plansCount || 0}</p>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {department.activePlansCount || 0} خطة نشطة
                </span>
              </div>

              <div className="rounded-2xl bg-gray-50/70 p-4 border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium">نسبة الإنجاز</span>
                  <CheckCircle2 size={16} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{Math.round(department.progress || 0)}%</p>
                <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, department.progress || 0)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50/70 p-4 border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-xs font-medium">الميزانية</span>
                  <Coins size={16} className="text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(department.budget || 0).toLocaleString('ar-SA')}
                </p>
                <span className="text-[11px] text-gray-400">ريال سعودي</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* العمود الأيمن (الخطط التشغيلية والمهام) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* الخطط التشغيلية */}
              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="text-indigo-600" size={20} />
                    الخطط التشغيلية التابعة للقسم
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                      {department.plans?.length || 0} خطط
                    </span>
                    {/* زر إنشاء خطة متاح للمالك ولمدير هذا القسم فقط ومخفي عن العضو العادي */}
                    {department.canCreatePlan && (
                      <Link
                        href={`/dashboard/Plans`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Plus size={14} />
                        إضافة خطة
                      </Link>
                    )}
                  </div>
                </div>

                {department.plans && department.plans.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {department.plans.map((plan: any) => (
                      <Link
                        key={plan.id}
                        href={`/dashboard/plans/${plan.id}`}
                        className="group block rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {plan.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              plan.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {plan.status === 'active' ? 'نشط' : plan.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{plan.tasksCount || 0} مهمة معتمدة</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-500">التقدم</span>
                            <span className="text-indigo-600 font-bold">{Math.round(plan.progress || 0)}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, plan.progress || 0)}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                    لا توجد خطط تشغيلية مسجلة لهذا القسم حالياً.
                  </div>
                )}
              </section>

              {/* قسم المهام والأهداف المسندة مع الفلاتر الكاملة */}
              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="text-indigo-600" size={20} />
                    المهام والأهداف المسندة
                  </h2>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold">
                    {department.tasksCount ?? 0} مهمة
                  </span>
                </div>

                {/* شريط الفلاتر الأنيق (الحالة، الشخص، الخطة، البحث، ومسح الفلاتر) */}
                <DepartmentTasksFilters
                  statusFilter={statusFilter}
                  onStatusChange={(statuses) => updateFiltersInUrl({ status: statuses })}
                  assigneeFilter={assigneeFilter}
                  onAssigneeChange={(assignees) => updateFiltersInUrl({ assignee: assignees })}
                  planIdFilter={planIdFilter}
                  onPlanIdChange={(pId) => updateFiltersInUrl({ planId: pId })}
                  searchQuery={searchQuery}
                  onSearchChange={(q) => updateFiltersInUrl({ search: q })}
                  onClearAll={handleClearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                  statusCounts={department.statusCounts}
                  availableAssignees={department.availableAssignees}
                  plans={department.plans}
                />

                {department.tasks && department.tasks.length > 0 ? (
                  <>
                    <div className="divide-y divide-gray-100">
                      {department.tasks.map((task: any) => (
                        <div key={task.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <span>الخطة: {task.planName || 'خطة عامة'}</span>
                              <span>•</span>
                              <span>المسؤول: {task.assignee || 'غير محدد'}</span>
                              {task.dueDate && (
                                <>
                                  <span>•</span>
                                  <span>تاريخ الإنجاز: {new Date(task.dueDate).toLocaleDateString('ar-SA')}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {task.cost > 0 && (
                              <span className="text-xs font-mono font-bold text-gray-700">
                                {task.cost.toLocaleString('ar-SA')} ر.س
                              </span>
                            )}
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                task.status === 'done' || task.status === 'completed' || task.progress >= 100
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                  : task.dueDate && new Date(task.dueDate).getTime() < Date.now()
                                  ? 'bg-red-50 text-red-700 border border-red-200/50'
                                  : task.status === 'in_progress' || task.progress > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200/50'
                              }`}
                            >
                              {task.status === 'done' || task.status === 'completed' || task.progress >= 100
                                ? 'أنجزت'
                                : task.dueDate && new Date(task.dueDate).getTime() < Date.now()
                                ? 'متأخرة'
                                : task.status === 'in_progress' || task.progress > 0
                                ? 'قيد الإنجاز'
                                : 'لم تبدأ'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* أدوات ترقيم الصفحات (Pagination) عند وجود أكثر من صفحة */}
                    {department.pagination && department.pagination.totalPages > 1 && (
                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          صفحة {department.pagination.page} من {department.pagination.totalPages} ({department.pagination.totalCount} مهمة)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={department.pagination.page <= 1}
                            onClick={() => updateFiltersInUrl({ page: department.pagination.page - 1 })}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="الصفحة السابقة"
                          >
                            <ChevronRight size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={department.pagination.page >= department.pagination.totalPages}
                            onClick={() => updateFiltersInUrl({ page: department.pagination.page + 1 })}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="الصفحة التالية"
                          >
                            <ChevronLeft size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : hasActiveFilters ? (
                  /* حالة عدم وجود مهام تطابق الفلاتر مع زر مسح */
                  <div className="py-12 px-4 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 mx-auto mb-3 shadow-sm">
                      <Filter size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">لا توجد مهام مطابقة</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      لم نجد أي مهام تطابق خيارات الفلاتر الحالية. جرّب تعديل الفلاتر أو مسحها.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <RotateCcw size={13} />
                      مسح الفلاتر
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                    لا توجد مهام مسندة لهذا القسم حالياً.
                  </div>
                )}
              </section>
            </div>

            {/* العمود الأيسر (أعضاء القسم) */}
            <div className="space-y-8">
              <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="text-indigo-600" size={20} />
                    أعضاء القسم ({department.members?.length || 0})
                  </h2>
                </div>

                {department.members && department.members.length > 0 ? (
                  <div className="space-y-3">
                    {department.members.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs">
                            {m.name ? m.name.slice(0, 2).toUpperCase() : <User size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{m.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono truncate">{m.email}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            m.departmentRole === 'head'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {m.departmentRole === 'head' ? 'رئيس القسم' : 'عضو'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">لم يتم إضافة أعضاء بعد.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function DepartmentPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" dir="rtl">
      <div className="h-48 bg-gray-100 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-64 bg-gray-100 rounded-3xl" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
        <div className="h-80 bg-gray-100 rounded-3xl" />
      </div>
    </div>
  );
}
