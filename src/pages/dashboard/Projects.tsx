import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import {
  Plus, MoreVertical, FileText, Edit2, Trash2, AlertCircle,
  Save, Loader2, Info, TrendingUp, Calendar, DollarSign,
  Building2, Briefcase, Cpu, Wrench, BarChart3, Eye,
  MapPin, Clock, Sparkles, ChevronLeft
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// Industry config for visual differentiation
const industryConfig: Record<string, { icon: any; gradient: string; accent: string; bg: string; label: string }> = {
  'تجاري': {
    icon: Briefcase,
    gradient: 'from-blue-500 to-indigo-600',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'تجاري',
  },
  'صناعي': {
    icon: Building2,
    gradient: 'from-amber-500 to-orange-600',
    accent: 'text-amber-600',
    bg: 'bg-amber-50',
    label: 'صناعي',
  },
  'خدمي': {
    icon: Wrench,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'خدمي',
  },
  'تقني': {
    icon: Cpu,
    gradient: 'from-violet-500 to-purple-600',
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
    label: 'تقني',
  },
  'آخر': {
    icon: BarChart3,
    gradient: 'from-rose-500 to-pink-600',
    accent: 'text-rose-600',
    bg: 'bg-rose-50',
    label: 'آخر',
  },
};

const getIndustryConfig = (industry: string) => {
  return industryConfig[industry] || industryConfig['آخر'];
};

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toLocaleString('ar-SA');
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getRelativeTime = (date: string | Date) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
  return `منذ ${Math.floor(diffDays / 365)} سنوات`;
};

// ─── Project Card Component ─────────────────────────────────────
const ProjectCard = ({
  project,
  onDelete,
  index,
  isDraft = false,
  onSaveDraft,
  isSavingDraft = false,
}: {
  project: any;
  onDelete?: (id: string) => void;
  index: number;
  isDraft?: boolean;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  let config = getIndustryConfig(project.industry);
  if (isDraft) {
    config = { icon: FileText, gradient: 'from-slate-400 to-gray-500', accent: 'text-slate-600', bg: 'bg-slate-100', label: 'مسودة غير محفوظة' };
  } else if (project.status && project.status !== 'غير محدد') {
    const isExcellent = typeof project.status === 'string' && project.status.includes('ممتاز');
    const isGood = typeof project.status === 'string' && project.status.includes('جيد');
    
    if (isExcellent) {
      config = {
        ...config,
        gradient: 'from-blue-500 to-indigo-600',
        accent: 'text-blue-600',
        bg: 'bg-blue-50',
      };
    } else if (isGood) {
      config = {
        ...config,
        gradient: 'from-emerald-500 to-teal-600',
        accent: 'text-emerald-600',
        bg: 'bg-emerald-50',
      };
    } else {
      config = {
        ...config,
        gradient: 'from-rose-500 to-red-600',
        accent: 'text-rose-600',
        bg: 'bg-rose-50',
      };
    }
  }
    
  const IndustryIcon = config.icon;

  return (
    <div
      className={`group relative bg-white rounded-2xl border ${isDraft ? 'border-dashed border-gray-300' : 'border-gray-100'} overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* ── Gradient Top Strip ──────────────────────────── */}
      <div className={`h-1.5 bg-gradient-to-l ${config.gradient}`} />

      {/* ── Card Body ──────────────────────────────────── */}
      <div className="p-5 pb-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Industry Icon */}
            <div className={`shrink-0 w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <IndustryIcon size={20} className={config.accent} />
            </div>
            {/* Title & Date */}
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900 truncate leading-snug" title={project.name}>
                {project.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-400">
                  {isDraft ? 'الآن' : getRelativeTime(project.createdAt || Date.now())}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu (Hidden for draft) */}
          {!isDraft && onDelete && (
            <div className="relative shrink-0 mr-1">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    <Link
                      href={`/tool/FeasibilityTool?edit=${project.id}`}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 size={15} className="text-gray-400" /> تعديل المشروع
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(project.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                    >
                      <Trash2 size={15} /> حذف المشروع
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {isDraft && (
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="حذف المسودة"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <span className="shrink-0 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-amber-200">
                <AlertCircle size={12} />
                مسودة
              </span>
            </div>
          )}
        </div>

        {/* ── Info Chips ───────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Industry Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.accent}`}>
            <IndustryIcon size={12} />
            {isDraft ? 'مشروع مؤقت' : config.label}
          </span>

          {/* Capital Badge */}
          {project.targetCapital && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
              <DollarSign size={12} />
              {formatCurrency(project.targetCapital)} ر.س
            </span>
          )}

          {/* Location Badge */}
          {!isDraft && project.location && project.location !== 'غير محدد' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500">
              <MapPin size={12} />
              {project.location}
            </span>
          )}
        </div>

        {/* ── Date Info ────────────────────────────────── */}
        {!isDraft && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Calendar size={13} />
            <span>{formatDate(project.createdAt || Date.now())}</span>
          </div>
        )}
      </div>

      {/* ── Card Footer ────────────────────────────────── */}
      <div className={`border-t border-gray-100 bg-gradient-to-l ${isDraft ? 'from-amber-50/50 to-white' : 'from-gray-50/80 to-white'} px-5 py-3`}>
        {isDraft ? (
          <div className="flex items-center justify-center w-full">
            <Link
              href="/tool/FeasibilityTool"
              className="flex items-center justify-center w-full gap-2 text-sm font-semibold text-slate-700 bg-slate-200/60 hover:bg-slate-200 px-4 py-2.5 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
              إكمال التعديل لإتمام الحفظ
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/tool/FeasibilityTool?edit=${project.id}`}
              className={`flex items-center gap-2 text-sm font-semibold ${config.accent} hover:opacity-80 transition-opacity`}
            >
              <Eye size={16} />
              عرض التفاصيل
              <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            </Link>
  
            <Link href="/dashboard/Reports" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              <FileText size={14} />
              التقرير
            </Link>
          </div>
        )}
      </div>

      {/* ── Hover Glow Effect ──────────────────────────── */}
      {!isDraft && (
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${config.gradient} mix-blend-soft-light`} style={{ opacity: 0 }} />
      )}
    </div>
  );
};

// ─── Loading Skeleton Card ──────────────────────────────────────
const SkeletonCard = ({ index }: { index: number }) => (
  <div
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="h-1.5 bg-gray-200" />
    <div className="p-5 pb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-50 rounded-lg w-1/3" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-7 bg-gray-100 rounded-lg w-16" />
        <div className="h-7 bg-gray-100 rounded-lg w-20" />
      </div>
      <div className="h-3 bg-gray-50 rounded-lg w-2/5" />
    </div>
    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
      <div className="flex justify-between">
        <div className="h-5 bg-gray-100 rounded-lg w-24" />
        <div className="h-7 bg-gray-100 rounded-lg w-16" />
      </div>
    </div>
  </div>
);

// ─── Main Projects Page ─────────────────────────────────────────
export default function Projects() {
  const { data: projects, isLoading, isError } = useProjects();
  const { mutate: deleteProject } = useDeleteProject();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  // Unsaved project handling
  const [unsavedData, setUnsavedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedData = sessionStorage.getItem('feasibilityToolData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed?.projectInfo?.projectName) {
          setUnsavedData(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const handleSaveUnsaved = async () => {
    try {
      setIsSaving(true);
      
      const desc = unsavedData?.projectInfo?.description || '';
      const validDesc = desc.length >= 10 ? desc : (desc + ' (تم إنشاء هذا المشروع من خلال الأداة).');
      const capital = Number(unsavedData?.financialData?.initialCapital);
      
      const payload = {
        name: unsavedData?.projectInfo?.projectName || 'مشروع جديد',
        industry: unsavedData?.projectInfo?.activityType || 'آخر',
        location: 'غير محدد',
        targetCapital: capital > 0 ? capital : 1000,
        durationYears: 3,
        description: validDesc,
        financialInputs: {
          monthlyOperatingCosts: Number(unsavedData?.financialData?.monthlyOperatingCosts) || 0,
          expectedMonthlyRevenue: Number(unsavedData?.financialData?.expectedMonthlyRevenue) || 0
        }
      };

      await axios.post('/projects', payload);
      
      toast.success('تم حفظ دراسة الجدوى بنجاح! 🎉');
      sessionStorage.removeItem('feasibilityToolData');
      sessionStorage.removeItem('feasibilityToolStep');
      setUnsavedData(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error: any) {
      console.error('Save error:', error.response?.data || error.message);
      toast.error('حدث خطأ أثناء حفظ دراسة الجدوى. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      if (deleteId === 'draft') {
        sessionStorage.removeItem('feasibilityToolData');
        sessionStorage.removeItem('feasibilityToolStep');
        setUnsavedData(null);
        setDeleteId(null);
        toast.success('تم حذف المسودة بنجاح');
      } else {
        deleteProject(deleteId);
        setDeleteId(null);
      }
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>مشاريعي - أداة دراسة الجدوى</title>
      </Head>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Sparkles size={22} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">مشاريعي</h1>
          </div>
          <p className="text-gray-500 text-sm mr-12">إدارة جميع دراسات الجدوى الخاصة بك</p>
        </div>
        <Link 
          href="/tool/FeasibilityTool" 
          className="flex items-center gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={20} />
          <span>مشروع جديد</span>
        </Link>
      </div>

      {/* ── Error Banner ───────────────────────────────── */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <p className="font-medium">حدث خطأ أثناء جلب المشاريع. يرجى المحاولة مرة أخرى.</p>
        </div>
      )}

      {/* ── Stats Bar (only when projects exist) ─────── */}
      {!isLoading && (projects?.length || 0) + (unsavedData ? 1 : 0) > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm">
            <BarChart3 size={16} className="text-blue-500" />
            {(projects?.length || 0) + (unsavedData ? 1 : 0)} {(projects?.length || 0) + (unsavedData ? 1 : 0) === 1 ? 'مشروع' : 'مشاريع'}
          </span>
        </div>
      )}

      {/* ── Loading State ──────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : (projects?.length === 0 && !unsavedData) ? (
        /* ── Empty State ───────────────────────────────── */
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-100/50 rotate-3">
              <FileText size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد مشاريع حالياً</h3>
            <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
              قم بإنشاء أول دراسة جدوى لمشروعك الآن لتبدأ رحلتك في التخطيط الناجح.
            </p>
            <Link 
              href="/tool/FeasibilityTool" 
              className="inline-flex items-center gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Plus size={20} />
              إنشاء مشروع جديد
            </Link>
          </div>
        </div>
      ) : (
        /* ── Projects Grid ─────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Draft Project (if any) */}
          {unsavedData && (
             <ProjectCard
                key="unsaved-draft-project"
                project={{
                  id: 'draft',
                  name: unsavedData?.projectInfo?.projectName || 'مشروع غير مسمى',
                  industry: unsavedData?.projectInfo?.activityType || 'غير محدد',
                  targetCapital: unsavedData?.financialData?.initialCapital || 0,
                  createdAt: Date.now(),
                }}
                isDraft={true}
                onSaveDraft={handleSaveUnsaved}
                isSavingDraft={isSaving}
                onDelete={() => setDeleteId('draft')}
                index={0}
             />
          )}

          {/* Saved Projects */}
          {projects?.map((project: any, index: number) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(id) => setDeleteId(id)}
              index={unsavedData ? index + 1 : index}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-5 rotate-3">
              <Trash2 size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">هل أنت متأكد من الحذف؟</h3>
            <p className="text-gray-500 mb-7 leading-relaxed">
              سيتم حذف هذا المشروع وكافة البيانات والتقارير المرتبطة به نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-l from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
