import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { 
  FileText, Trash2, AlertCircle, Calendar, Eye, Download, BarChart3, 
  Clock, Sparkles, Filter, Building2, User, RotateCcw 
} from 'lucide-react';
import { useToolRuns, useDeleteToolRun } from '@/hooks/useToolRuns';
import { useDepartments } from '@/hooks/useDepartments';
import { useOrgMembers } from '@/hooks/useOrg';
import { getToolBySlug, getToolStartPath, getAvailableTools } from "@/config/tools.registry";
import { useAuth } from '@/context/AuthContext';
import { FilterBar } from '@/components/ui/filters';
import type { FilterItemConfig, FilterValues, DateRangeValue } from '@/components/ui/filters/types';

/** Types matching the Prisma Report model */
interface LegacyReport {
  id: string;
  projectId: string;
  projectName?: string;
  activityType?: string;
  status?: string;
  createdAt: string;
  pdfPath?: string | null;
}

const fetchUserReports = async ({ queryKey }: any): Promise<{ reports: LegacyReport[]; total: number }> => {
  const [_key, { page, limit }] = queryKey;
  const res = await axios.get(`/reports?skip=${(page - 1) * limit}&take=${limit}`);
  return {
    reports: res.data.data.map((item: any) => ({
      id: item.reportId,
      projectName: item.projectName,
      activityType: item.industry,
      createdAt: item.createdAt,
      projectId: item.reportId,
      status: item.status,
    })),
    total: res.data.count,
  };
};

const deleteReportApi = async (reportId: string) => {
  const res = await axios.delete(`/reports/${reportId}`);
  return res.data;
};

// --- Format helpers ---
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

// --- Unified Report Card Component ---
const UnifiedReportCard = ({ 
  item, 
  onDelete, 
  index 
}: { 
  item: any; 
  onDelete: (id: string, isToolRun: boolean) => void; 
  index: number 
}) => {
  const isToolRun = item.type === 'toolRun';
  
  // Theme logic
  let theme = {
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    shadowHover: 'hover:shadow-blue-100/50',
    overlayBg: 'from-blue-500 to-indigo-600',
  };

  let Icon = BarChart3;
  let activityType = item.activityType || 'غير محدد';
  let openHref = '';
  let downloadHref = '';

  if (isToolRun) {
    const tool = getToolBySlug(item.toolSlug);
    if (tool) {
      Icon = tool.icon;
      activityType = tool.name;
      theme = {
        gradient: `from-${tool.accent.bg.split('-')[1]}-500 to-${tool.accent.bg.split('-')[1]}-600`, // Approximation
        bg: tool.accent.bg,
        text: tool.accent.text,
        shadowHover: `hover:shadow-lg`,
        overlayBg: `from-${tool.accent.bg.split('-')[1]}-500 to-${tool.accent.bg.split('-')[1]}-600`,
      };
      openHref = `${getToolStartPath(tool.slug)}?run=${item.id}`;
    }
  } else {
    const isExcellent = typeof item.status === 'string' && item.status.includes('ممتاز');
    const isGood = typeof item.status === 'string' && item.status.includes('جيد');
    
    if (isExcellent) {
      // default theme
    } else if (isGood) {
      theme = {
        gradient: 'from-emerald-500 to-teal-600',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        shadowHover: 'hover:shadow-emerald-100/50',
        overlayBg: 'from-emerald-500 to-teal-600',
      };
    } else {
      theme = {
        gradient: 'from-rose-500 to-red-600',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        shadowHover: 'hover:shadow-rose-100/50',
        overlayBg: 'from-rose-500 to-red-600',
      };
    }
    openHref = `/tools/feasibility-study/start?edit=${item.projectId}`;
    downloadHref = `/api/reports/${item.id}/download`;
  }

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-xl ${theme.shadowHover} hover:-translate-y-1`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`h-1.5 bg-gradient-to-l ${theme.gradient}`} />
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`shrink-0 w-11 h-11 rounded-xl ${theme.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon size={20} className={theme.text} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900 truncate leading-snug" title={item.projectName}>
                {item.projectName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-400">
                  {getRelativeTime(item.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 mr-1">
            <button
              onClick={() => onDelete(item.id, isToolRun)}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="حذف التقرير"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${theme.bg} ${theme.text}`}>
            <Icon size={12} />
            {activityType}
          </span>
          {isToolRun && item.planName && (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
               خطة: {item.planName}
             </span>
          )}
          {item.departmentName && (
             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
               {item.departmentName}
             </span>
          )}
          {item.userName && (
             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
               {item.userName}
             </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Calendar size={13} />
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gradient-to-l from-gray-50/80 to-white px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          {openHref ? (
            <Link
              href={openHref}
              className={`flex items-center gap-2 text-sm font-semibold ${theme.text} hover:opacity-80 transition-opacity`}
            >
              <Eye size={16} />
              عرض التقرير
            </Link>
          ) : (
            <span className="text-sm text-gray-400">لا يوجد رابط</span>
          )}

          {downloadHref && (
            <a 
              href={downloadHref} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            >
              <Download size={14} />
              تحميل PDF
            </a>
          )}
        </div>
      </div>
      {/* Hover background effect omitted for simplicity with dynamic colors */}
    </div>
  );
};

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

export default function Reports() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // Legacy reports pagination
  const [page, setPage] = useState(1);
  const limit = 9;

  // Fetch legacy reports
  const { data: legacyData, isLoading: isLoadingLegacy, isError: isErrorLegacy } = useQuery({
    queryKey: ['userReports', { page, limit }],
    queryFn: fetchUserReports,
    placeholderData: keepPreviousData,
  });

  // Fetch new tool runs
  const { data: toolRuns, isLoading: isLoadingRuns, isError: isErrorRuns } = useToolRuns({ enabled: isAuthenticated });
  const { mutate: deleteToolRun } = useDeleteToolRun();

  const [deleteItem, setDeleteItem] = useState<{ id: string, isToolRun: boolean } | null>(null);

  const deleteLegacyMutation = useMutation({
    mutationFn: deleteReportApi,
    onSuccess: () => {
      toast.success('تم حذف التقرير بنجاح');
      queryClient.invalidateQueries({ queryKey: ['userReports'] });
      setDeleteItem(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف التقرير');
    },
  });

  const confirmDelete = () => {
    if (!deleteItem) return;
    if (deleteItem.isToolRun) {
      deleteToolRun(deleteItem.id);
      setDeleteItem(null);
    } else {
      deleteLegacyMutation.mutate(deleteItem.id);
    }
  };

interface UnifiedReportItem {
  type: 'toolRun' | 'legacy';
  id: string;
  projectId: string;
  projectName?: string;
  toolSlug?: string;
  planName?: string;
  departmentId?: string;
  departmentName?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  activityType?: string;
  status?: string;
  pdfPath?: string | null;
}

  const router = useRouter();
  const { data: departments } = useDepartments();
  const { data: membersList } = useOrgMembers();

  // URL Query / Filter States
  const [search, setSearch] = useState<string>((router.query.q as string) || (router.query.search as string) || '');
  const [toolSlugFilter, setToolSlugFilter] = useState<string>((router.query.toolSlug as string) || '');
  const [deptFilter, setDeptFilter] = useState<string>((router.query.departmentId as string) || '');
  const [assigneeFilter, setAssigneeFilter] = useState<string>((router.query.assignee as string) || '');
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: (router.query.startDate as string) || undefined,
    to: (router.query.endDate as string) || undefined,
  });

  // URL sync handler
  const syncToUrl = useCallback((updates: Record<string, any>) => {
    const nextQuery = { ...router.query, ...updates };
    Object.keys(nextQuery).forEach(k => {
      if (nextQuery[k] === '' || nextQuery[k] === undefined || nextQuery[k] === null) {
        delete nextQuery[k];
      }
    });
    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [router]);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.q !== undefined) setSearch(String(router.query.q));
      if (router.query.toolSlug !== undefined) setToolSlugFilter(String(router.query.toolSlug));
      if (router.query.departmentId !== undefined) setDeptFilter(String(router.query.departmentId));
      if (router.query.assignee !== undefined) setAssigneeFilter(String(router.query.assignee));
      if (router.query.startDate !== undefined || router.query.endDate !== undefined) {
        setDateRange({
          from: router.query.startDate ? String(router.query.startDate) : undefined,
          to: router.query.endDate ? String(router.query.endDate) : undefined,
        });
      }
    }
  }, [router.isReady, router.query]);

  // Combine data
  const combinedReports = useMemo(() => {
    const list: UnifiedReportItem[] = [];
    
    // Add tool runs
    if (toolRuns) {
      const formattedRuns = toolRuns.map(run => ({
        type: 'toolRun' as const,
        id: run.id,
        projectId: run.id,
        projectName: run.title,
        toolSlug: run.toolSlug,
        planName: run.plan?.name,
        departmentId: run.department?.id || (run as any).departmentId,
        departmentName: run.department?.name,
        userId: run.user?.id,
        userName: run.user?.name,
        createdAt: run.createdAt || run.updatedAt,
      }));
      list.push(...formattedRuns);
    }
    
    // Add legacy reports
    if (legacyData?.reports) {
      const formattedLegacy = legacyData.reports.map(rep => ({
        type: 'legacy' as const,
        id: rep.id,
        projectId: rep.projectId,
        projectName: rep.projectName,
        activityType: rep.activityType,
        createdAt: rep.createdAt,
        status: rep.status,
        pdfPath: rep.pdfPath,
        toolSlug: 'feasibility-study',
      }));
      list.push(...formattedLegacy);
    }
    
    // Sort by date descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return list;
  }, [toolRuns, legacyData]);

  const availableTools = useMemo(() => {
    return getAvailableTools();
  }, []);

  const filterConfigs: FilterItemConfig[] = useMemo(() => [
    {
      key: 'toolSlug',
      label: 'الأداة / النوع',
      type: 'select',
      icon: BarChart3,
      isAllOptionLabel: 'كل الأدوات',
      options: [
        { value: 'feasibility-study', label: 'دراسة الجدوى (مشاريع)' },
        ...availableTools.map((t: any) => ({
          value: t.slug,
          label: t.name,
        })),
      ],
      searchThreshold: 5,
    },
    {
      key: 'departmentId',
      label: 'القسم',
      type: 'select',
      icon: Building2,
      isAllOptionLabel: 'كل الأقسام',
      options: (departments || []).map((d: any) => ({
        value: d.id,
        label: d.name,
        dotColor: d.color || '#6366F1',
      })),
      searchThreshold: 5,
    },
    {
      key: 'assignee',
      label: 'المسؤول',
      type: 'select',
      icon: User,
      isAllOptionLabel: 'كل المسؤولين',
      options: (membersList || []).map((m: any) => ({
        value: m.id || m.userId,
        label: m.name || m.user?.name,
        initials: (m.name || m.user?.name || '').slice(0, 2),
      })),
      searchThreshold: 5,
    },
    {
      key: 'dateRange',
      label: 'نطاق التاريخ',
      type: 'date-range',
      icon: Calendar,
    },
  ], [departments, membersList, availableTools]);

  const currentFilterValues: FilterValues = useMemo(() => ({
    toolSlug: toolSlugFilter,
    departmentId: deptFilter,
    assignee: assigneeFilter,
    dateRange,
  }), [toolSlugFilter, deptFilter, assigneeFilter, dateRange]);

  const handleFilterChange = (key: string, val: any) => {
    if (key === 'toolSlug') {
      const v = val || '';
      setToolSlugFilter(v);
      syncToUrl({ toolSlug: v });
    } else if (key === 'departmentId') {
      const v = val || '';
      setDeptFilter(v);
      syncToUrl({ departmentId: v });
    } else if (key === 'assignee') {
      const v = val || '';
      setAssigneeFilter(v);
      syncToUrl({ assignee: v });
    } else if (key === 'dateRange') {
      const range = (val as DateRangeValue) || {};
      setDateRange(range);
      syncToUrl({ startDate: range.from || '', endDate: range.to || '' });
    }
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    syncToUrl({ q });
  };

  const handleClearAll = () => {
    setSearch('');
    setToolSlugFilter('');
    setDeptFilter('');
    setAssigneeFilter('');
    setDateRange({});
    syncToUrl({ q: '', toolSlug: '', departmentId: '', assignee: '', startDate: '', endDate: '' });
  };

  const filteredReports = useMemo(() => {
    return combinedReports.filter(report => {
      if (toolSlugFilter && report.toolSlug !== toolSlugFilter) {
        return false;
      }
      if (deptFilter && report.departmentId !== deptFilter) {
        return false;
      }
      if (assigneeFilter && report.userId !== assigneeFilter) {
        return false;
      }
      if (dateRange.from || dateRange.to) {
        const itemDate = new Date(report.createdAt);
        if (dateRange.from && itemDate < new Date(dateRange.from)) return false;
        if (dateRange.to && itemDate > new Date(dateRange.to + 'T23:59:59')) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = report.projectName?.toLowerCase().includes(q);
        const matchesActivity = report.activityType?.toLowerCase().includes(q);
        const matchesPlan = report.planName?.toLowerCase().includes(q);
        const matchesDept = report.departmentName?.toLowerCase().includes(q);
        const matchesUser = report.userName?.toLowerCase().includes(q);
        if (!matchesName && !matchesActivity && !matchesPlan && !matchesDept && !matchesUser) {
          return false;
        }
      }
      return true;
    });
  }, [combinedReports, toolSlugFilter, deptFilter, assigneeFilter, dateRange, search]);

  const isLoading = isLoadingLegacy || isLoadingRuns;
  const isError = isErrorLegacy || isErrorRuns;

  return (
    <DashboardLayout>
      <Head>
        <title>التقارير الشاملة - المنصة</title>
      </Head>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <FileText size={22} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">تقارير المشاريع والأدوات</h1>
          </div>
          <p className="text-gray-500 text-sm mr-12">استعرض كافة التقارير والمخرجات الناتجة عن مشاريعك وأدواتك</p>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <p className="font-medium">حدث خطأ أثناء جلب التقارير. يرجى المحاولة مرة أخرى.</p>
        </div>
      )}

      {/* ── Filters Bar ────────────────────────────────── */}
      {!isLoading && combinedReports.length > 0 && (
        <FilterBar
          filters={filterConfigs}
          values={currentFilterValues}
          onChange={handleFilterChange}
          onClearAll={handleClearAll}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="ابحث في التقارير والمخرجات..."
          totalResults={filteredReports.length}
          resultsLabel="تقرير ومخرج"
          isLoading={isLoading}
        />
      )}

      {isLoading ? (
        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : combinedReports.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-100/50 rotate-3">
              <FileText size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد تقارير حالياً</h3>
            <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
              قم بإنشاء واستخدام الأدوات المختلفة أو دراسات الجدوى لتظهر تقاريرك ومخرجاتك هنا.
            </p>
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Sparkles size={20} />
              استكشاف الأدوات
            </Link>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
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
        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredReports.map((report, index) => (
            <UnifiedReportCard
              key={`${report.type}-${report.id}`}
              item={report}
              onDelete={(id, isToolRun) => setDeleteItem({ id, isToolRun })}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
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
              سيتم حذف هذا التقرير نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteItem(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmDelete}
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
