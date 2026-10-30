import React, { useEffect } from 'react';
import Link from 'next/link';
import { useDepartment } from '@/hooks/useDepartments';
import {
  Building2,
  X,
  User,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  ArrowLeft,
  ShieldAlert,
  Users,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export const DEPARTMENT_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
};

interface DepartmentDrawerProps {
  departmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DepartmentDrawer({ departmentId, isOpen, onClose }: DepartmentDrawerProps) {
  const { data: department, isLoading, isError, error } = useDepartment(isOpen ? departmentId : null);

  // إغلاق عند الضغط على زر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // منع التمرير في الخلفية عندما تكون النافذة مفتوحة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const colorScheme =
    (department?.color && DEPARTMENT_COLOR_MAP[department.color]) || DEPARTMENT_COLOR_MAP.indigo;

  const isForbidden = (error as any)?.response?.status === 403;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl" role="dialog" aria-modal="true">
      {/* الخلفية الضبابية */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* لوحة النافذة الجانبية - تفتح من الجهة اليسرى للشاشة بسرعة */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform ease-out duration-300 animate-in slide-in-from-left">
          
          {/* شريط الرأس */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border}`}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {department?.name || 'تفاصيل القسم'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">لوحة ملخص القسم والمهام</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="إغلاق النافذة"
            >
              <X size={20} />
            </button>
          </div>

          {/* محتوى النافذة */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <DepartmentDrawerSkeleton />
            ) : isForbidden ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-100">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">ليس لديك صلاحية</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  ليس لديك تصريح للوصول إلى تفاصيل هذا القسم. يُسمح بالوصول فقط لأعضاء القسم والمشرفين.
                </p>
              </div>
            ) : isError || !department ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-3 border border-red-100">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">تعذر تحميل بيانات القسم</h3>
                <p className="text-xs text-gray-500">حدث خطأ أثناء الاتصال بالخادم.</p>
              </div>
            ) : (
              <>
                {/* الوصف ورئيس القسم */}
                <div className="rounded-2xl bg-gray-50/70 border border-gray-100 p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      عن القسم
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {department.description || 'لا يوجد وصف متاح لهذا القسم حالياً.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {department.head?.name ? department.head.name.slice(0, 2).toUpperCase() : <User size={16} />}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">رئيس القسم</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {department.head?.name || 'لم يُحدد رئيس بعد'}
                        </p>
                      </div>
                    </div>
                    {department.head?.email && (
                      <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-100 font-mono">
                        {department.head.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* مؤشرات الأداء السريعة (4 بطاقات) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* عدد الأعضاء */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-medium">أعضاء القسم</span>
                      <Users size={16} className="text-indigo-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{department.membersCount || 0}</p>
                    <span className="text-[11px] text-gray-400">عضو نشط</span>
                  </div>

                  {/* الخطط التشغيلية */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-medium">الخطط التشغيلية</span>
                      <Briefcase size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{department.plansCount || 0}</p>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {department.activePlansCount || 0} نشطة
                    </span>
                  </div>

                  {/* نسبة الإنجاز */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-medium">نسبة الإنجاز</span>
                      <CheckCircle2 size={16} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(department.progress || 0)}%</p>
                    <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, department.progress || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* الميزانية التقديرية */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-xs font-medium">الميزانية</span>
                      <Coins size={16} className="text-amber-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {(department.budget || 0).toLocaleString('ar-SA')}
                    </p>
                    <span className="text-[11px] text-gray-400">ريال سعودي</span>
                  </div>
                </div>

                {/* قسم الخطط التشغيلية */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Briefcase size={16} className="text-indigo-600" />
                      الخطط التشغيلية ({department.plans?.length || 0})
                    </h3>
                  </div>

                  {department.plans && department.plans.length > 0 ? (
                    <div className="space-y-2.5">
                      {department.plans.map((plan: any) => (
                        <div
                          key={plan.id}
                          className="rounded-xl border border-gray-100 bg-white p-3.5 hover:border-indigo-100 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-gray-900">{plan.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                plan.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {plan.status === 'active' ? 'نشطة' : plan.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>{plan.tasksCount || 0} مهمة</span>
                            <span className="font-bold text-indigo-600">
                              {Math.round(plan.progress || 0)}%
                            </span>
                          </div>

                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, plan.progress || 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                      لا توجد خطط تشغيلية مسجلة لهذا القسم حالياً.
                    </div>
                  )}
                </div>

                {/* قسم المهام الخاصة بالقسم */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      المهام والأهداف ({department.tasks?.length || 0})
                    </h3>
                  </div>

                  {department.tasks && department.tasks.length > 0 ? (
                    <div className="space-y-2.5">
                      {department.tasks.slice(0, 8).map((task: any) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-gray-100 bg-white p-3 hover:border-gray-200 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="font-medium text-xs text-gray-900 line-clamp-1">
                              {task.title}
                            </h4>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                task.status === 'done' || task.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-50 text-blue-700'
                                  : task.status === 'overdue'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {task.status === 'done' || task.status === 'completed'
                                ? 'مكتملة'
                                : task.status === 'in_progress'
                                ? 'قيد التنفيذ'
                                : task.status === 'overdue'
                                ? 'متأخرة'
                                : 'لم تبدأ'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>المسؤول: {task.assignee || 'غير محدد'}</span>
                            {task.cost > 0 && (
                              <span className="font-mono text-gray-700 font-semibold">
                                {task.cost.toLocaleString('ar-SA')} ر.س
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {department.tasks.length > 8 && (
                        <p className="text-center text-xs text-gray-400 py-1">
                          + {department.tasks.length - 8} مهام أخرى في صفحة القسم
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                      لا توجد مهام مسندة حالياً.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* تذييل النافذة: زر الانتقال إلى صفحة القسم الكاملة */}
          {department && !isForbidden && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Link
                href={`/dashboard/departments/${department.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span>فتح صفحة القسم الكاملة</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepartmentDrawerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton header box */}
      <div className="h-24 bg-gray-100 rounded-2xl" />

      {/* Skeleton 4 cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>

      {/* Skeleton plans list */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
      </div>

      {/* Skeleton tasks list */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-14 bg-gray-100 rounded-xl" />
        <div className="h-14 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
