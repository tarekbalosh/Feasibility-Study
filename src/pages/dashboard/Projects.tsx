import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { useToolRuns, useDeleteToolRun } from '@/hooks/useToolRuns';
import { useDepartments } from '@/hooks/useDepartments';
import { ToolRunCard } from '@/components/dashboard/ToolRunCard';
import { useAuth } from '@/context/AuthContext';
import {
  Plus, FileText, Edit2, Trash2, AlertCircle,
  Save, Loader2, Info, TrendingUp, Calendar, DollarSign,
  Building2, Briefcase, Cpu, Wrench, BarChart3, Eye,
  MapPin, Clock, Sparkles, ChevronLeft, Filter, ChevronDown, Check,
  CheckCircle2, RotateCcw
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { FilterBar, FilterItemConfig, FilterValues } from '@/components/ui/filters';

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
  // No local state needed anymore for dropdown
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

          {/* Actions (Hidden for draft) */}
          {!isDraft && onDelete && (
            <div className="flex items-center gap-1 shrink-0 mr-1 transition-opacity">
              <Link
                href={`/tools/feasibility-study/start?edit=${project.id}`}
                className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors group-hover:text-gray-400"
                title="تعديل المشروع"
              >
                <Edit2 size={16} />
              </Link>
              <button
                onClick={() => onDelete(project.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors group-hover:text-gray-400"
                title="حذف المشروع"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
          {isDraft && (
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
              href="/tools/feasibility-study/start"
              className="flex items-center justify-center w-full gap-2 text-sm font-semibold text-slate-700 bg-slate-200/60 hover:bg-slate-200 px-4 py-2.5 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
              إكمال التعديل لإتمام الحفظ
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/tools/feasibility-study/start?edit=${project.id}`}
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

  // ── تحليلات الأدوات المحفوظة ─────────────────────────────
  // لوحة واحدة تجمع مخرجات كل الأدوات، لا دراسات الجدوى وحدها.
  const { isAuthenticated } = useAuth();
  const { data: toolRuns, isLoading: isLoadingRuns } = useToolRuns({ enabled: isAuthenticated });
  const { mutate: deleteToolRun } = useDeleteToolRun();
  const [deleteRunId, setDeleteRunId] = useState<string | null>(null);

  const { data: departments } = useDepartments();

  // ── Filters State ────────────────────────────────────────
  const [search, setSearch] = useState(() => (typeof router.query.search === 'string' ? router.query.search : ''));
  const [statusFilter, setStatusFilter] = useState(() => (typeof router.query.status === 'string' ? router.query.status : ''));
  const [deptFilter, setDeptFilter] = useState(() => (typeof router.query.department === 'string' ? router.query.department : ''));
  const [toolSlugFilter, setToolSlugFilter] = useState(() => (typeof router.query.tool === 'string' ? router.query.tool : ''));

  // Sync to URL
  useEffect(() => {
    if (!router.isReady) return;
    const nextQuery: Record<string, any> = { ...router.query };

    if (search.trim()) nextQuery.search = search.trim();
    else delete nextQuery.search;

    if (statusFilter) nextQuery.status = statusFilter;
    else delete nextQuery.status;

    if (deptFilter) nextQuery.department = deptFilter;
    else delete nextQuery.department;

    if (toolSlugFilter) nextQuery.tool = toolSlugFilter;
    else delete nextQuery.tool;

    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [search, statusFilter, deptFilter, toolSlugFilter]);

  const availableTools = React.useMemo(() => {
    return require('@/config/tools.registry').getAvailableTools();
  }, []);

  const filterConfigs: FilterItemConfig[] = useMemo(() => {
    const list: FilterItemConfig[] = [
      {
        key: 'status',
        label: 'الحالة',
        type: 'select',
        icon: CheckCircle2,
        isAllOptionLabel: 'كل الحالات',
        options: [
          { value: 'excellent', label: 'مجدي ممتاز', dotColor: '#10B981' },
          { value: 'good', label: 'مجدي جيد', dotColor: '#3B82F6' },
          { value: 'caution', label: 'يحتاج مراجعة', dotColor: '#EF4444' },
        ],
      },
    ];

    if (departments && departments.length > 0) {
      list.push({
        key: 'departmentId',
        label: 'القسم',
        type: 'select',
        icon: Building2,
        isAllOptionLabel: 'كل الأقسام',
        options: departments.map((d: any) => ({ value: d.id, label: d.name })),
        searchThreshold: 5,
      });
    }

    list.push({
      key: 'toolSlug',
      label: 'نوع الأداة',
      type: 'select',
      icon: BarChart3,
      isAllOptionLabel: 'جميع الأدوات',
      options: availableTools.map((t: any) => ({
        value: t.slug,
        label: t.name,
      })),
      searchThreshold: 5,
    });

    return list;
  }, [departments, availableTools]);

  const currentFilterValues: FilterValues = useMemo(
    () => ({
      status: statusFilter,
      departmentId: deptFilter,
      toolSlug: toolSlugFilter,
    }),
    [statusFilter, deptFilter, toolSlugFilter]
  );

  const handleFilterChange = (key: string, val: any) => {
    if (key === 'status') setStatusFilter(val || '');
    else if (key === 'departmentId') setDeptFilter(val || '');
    else if (key === 'toolSlug') setToolSlugFilter(val || '');
  };

  const handleClearAll = () => {
    setSearch('');
    setStatusFilter('');
    setDeptFilter('');
    setToolSlugFilter('');
  };

  const filteredToolRuns = React.useMemo(() => {
    if (!toolRuns) return [];
    
    return toolRuns.filter((run) => {
      if (toolSlugFilter && run.toolSlug !== toolSlugFilter) {
        return false;
      }
      if (deptFilter && run.department?.id !== deptFilter && (run as any).departmentId !== deptFilter && (run.plan as any)?.departmentId !== deptFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesTitle = run.title?.toLowerCase().includes(q);
        const matchesSummary = run.summary?.toLowerCase().includes(q);
        const matchesPlan = run.plan?.name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesPlan) return false;
      }
      return true;
    });
  }, [toolRuns, toolSlugFilter, deptFilter, search]);

  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    if (toolSlugFilter && toolSlugFilter !== 'feasibility-study') {
      return [];
    }
    
    return projects.filter((p) => {
      if (statusFilter) {
        const s = String((p as any).status || '');
        if (statusFilter === 'excellent' && !s.includes('ممتاز')) return false;
        if (statusFilter === 'good' && !s.includes('جيد')) return false;
        if (statusFilter === 'caution' && (s.includes('ممتاز') || s.includes('جيد'))) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesInd = p.industry?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesInd) return false;
      }
      return true;
    });
  }, [projects, toolSlugFilter, statusFilter, search]);

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

  const showUnsaved = (!toolSlugFilter || toolSlugFilter === 'feasibility-study') && !deptFilter && !!unsavedData;

  const handleSaveUnsaved = async () => {
    try {
      setIsSaving(true);
      
      const desc = unsavedData?.projectInfo?.description || '';
      const validDesc = desc.length >= 10 ? desc : (desc + ' (تم إنشاء هذا المشروع من خلال الأداة).');
      const capital = Number(unsavedData?.financialData?.initialCapital);
      
      const payload = {
        name: unsavedData?.projectInfo?.projectName || unsavedData?.projectDetails?.projectName || 'مشروع جديد',
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

  /** إجمالي ما يظهر في الشبكة — مشاريع + تحليلات + مسودة */
  const totalCount = projects?.length ?? 0 + (toolRuns?.length ?? 0) + (unsavedData ? 1 : 0);
  const totalFilteredCount = filteredProjects.length + filteredToolRuns.length + (showUnsaved ? 1 : 0);

  const handleDeleteRun = () => {
    if (deleteRunId) {
      deleteToolRun(deleteRunId);
      setDeleteRunId(null);
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
        <title>مشاريعي - Feasibility Suite</title>
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
          <p className="text-gray-500 text-sm mr-12">كل ما أنتجته أدوات المنصة داخل مساحة عملك — في مكان واحد</p>
        </div>
      </div>

      {/* ── Filters Bar ────────────────────────────────── */}
      {!isLoading && !isLoadingRuns && totalCount > 0 && (
        <FilterBar
          filters={filterConfigs}
          values={currentFilterValues}
          onChange={handleFilterChange}
          onClearAll={handleClearAll}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="ابحث في المشاريع والتحليلات..."
          totalResults={totalFilteredCount}
          resultsLabel="مشروع وتحليل"
          isLoading={isLoading || isLoadingRuns}
        />
      )}

      {/* ── Error Banner ───────────────────────────────── */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <p className="font-medium">حدث خطأ أثناء جلب المشاريع. يرجى المحاولة مرة أخرى.</p>
        </div>
      )}

      {/* ── Loading State ──────────────────────────────── */}
      {isLoading || isLoadingRuns ? (
        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : totalCount === 0 ? (
        /* ── Empty State ───────────────────────────────── */
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-100/50 rotate-3">
              <FileText size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد أعمال محفوظة بعد</h3>
            <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
              كل تحليل تنتجه أي أداة يُحفظ هنا تلقائياً. ابدأ بأداة وسيظهر عملك في هذه الصفحة.
            </p>
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Plus size={20} />
              استعرض الأدوات
            </Link>
          </div>
        </div>
      ) : totalFilteredCount === 0 ? (
        /* ── Empty Filter State ───────────────────────────────── */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
            <Filter size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد نتائج مطابقة</h3>
          <p className="text-gray-500 text-sm">جرب إزالة بعض الفلاتر لرؤية المزيد من النتائج</p>
          <button 
            type="button"
            onClick={handleClearAll}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            <RotateCcw size={13} />
            <span>مسح الفلاتر</span>
          </button>
        </div>
      ) : (
        /* ── Projects Grid ─────────────────────────────── */
        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Draft Project (if any) */}
          {showUnsaved && (
             <ProjectCard
                key="unsaved-draft-project"
                project={{
                  id: 'draft',
                  name: unsavedData?.projectInfo?.projectName || unsavedData?.projectDetails?.projectName || 'مشروع غير مسمى',
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

          {/* تحليلات الأدوات المحفوظة — أحدثها أولاً */}
          {filteredToolRuns.map((run, index) => (
            <ToolRunCard
              key={run.id}
              run={run}
              onDelete={(id) => setDeleteRunId(id)}
              index={showUnsaved ? index + 1 : index}
            />
          ))}

          {/* Saved Projects */}
          {filteredProjects.map((project: any, index: number) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(id) => setDeleteId(id)}
              index={filteredToolRuns.length + (showUnsaved ? 1 : 0) + index}
            />
          ))}
        </div>
      )}

      {/* ── تأكيد حذف تحليل أداة ───────────────────────── */}
      {deleteRunId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-5 rotate-3">
              <Trash2 size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">حذف هذا التحليل؟</h3>
            <p className="text-gray-500 mb-7 leading-relaxed">
              سيُحذف التحليل من لوحة تحكّم مساحة عملك نهائياً، ولن يتمكّن أعضاء
              فريقك من الاطّلاع عليه بعد ذلك.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteRunId(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteRun}
                className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-l from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
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
