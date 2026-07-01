import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { FileText, Trash2, AlertCircle, Calendar, Eye, Download, BarChart3, Clock } from 'lucide-react';

/** Types matching the Prisma Report model */
interface Report {
  id: string;
  userId: string;
  projectId: string;
  content: any;
  pdfPath?: string | null;
  createdAt: string;
  projectName?: string;
  activityType?: string;
}

const fetchUserReports = async ({ queryKey }: any): Promise<{ reports: Report[]; total: number }> => {
  const [_key, { page, limit }] = queryKey;
  const res = await axios.get(`/reports?skip=${(page - 1) * limit}&take=${limit}`);
  return {
    reports: res.data.data.map((item: any) => ({
      id: item.reportId,
      projectName: item.projectName,
      activityType: item.industry,
      createdAt: item.createdAt,
      projectId: item.reportId,
      content: {},
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

// --- Report Card Component ---
const ReportCard = ({ report, onDelete, index }: { report: Report; onDelete: (id: string) => void; index: number }) => {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="h-1.5 bg-gradient-to-l from-blue-500 to-indigo-600" />
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900 truncate leading-snug" title={report.projectName || `مشروع ${report.projectId}`}>
                {report.projectName || `مشروع ${report.projectId}`}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-400">
                  {getRelativeTime(report.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 mr-1">
            <button
              onClick={() => onDelete(report.id)}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="حذف التقرير"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600">
            <BarChart3 size={12} />
            {report.activityType || 'غير محدد'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Calendar size={13} />
          <span>{formatDate(report.createdAt)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gradient-to-l from-gray-50/80 to-white px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/tool/FeasibilityTool?edit=${report.projectId}`}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:opacity-80 transition-opacity"
          >
            <Eye size={16} />
            عرض كامل
          </Link>

          {report.pdfPath && (
            <a 
              href={`/api/reports/${report.id}/download`} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            >
              <Download size={14} />
              تحميل PDF
            </a>
          )}
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-blue-500 to-indigo-600 mix-blend-soft-light" style={{ opacity: 0 }} />
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
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 9;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['userReports', { page, limit }],
    queryFn: fetchUserReports,
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReportApi,
    onSuccess: () => {
      toast.success('تم حذف التقرير بنجاح');
      queryClient.invalidateQueries({ queryKey: ['userReports'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف التقرير');
    },
  });

  const confirmDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <DashboardLayout>
      <Head>
        <title>التقارير - أداة دراسة الجدوى</title>
      </Head>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <FileText size={22} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">تقارير الجدوى الاقتصادية</h1>
          </div>
          <p className="text-gray-500 text-sm mr-12">استعرض وقم بتحميل التقارير النهائية لمشاريعك</p>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <p className="font-medium">{(error as any).message || 'حدث خطأ أثناء جلب التقارير. يرجى المحاولة مرة أخرى.'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : (data?.reports?.length === 0) ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-100/50 rotate-3">
              <FileText size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد تقارير حالياً</h3>
            <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
              قم بإنشاء دراسة جدوى جديدة واكتمل خطواتها لتظهر التقارير هنا.
            </p>
            <Link 
              href="/tool/FeasibilityTool" 
              className="inline-flex items-center gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <FileText size={20} />
              إنشاء دراسة جدوى
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data?.reports?.map((report, index) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={(id) => setDeleteId(id)}
                index={index}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-10 space-x-4 space-x-reverse">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              <span className="text-sm font-medium text-gray-600">
                الصفحة {page} من {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
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
              سيتم حذف هذا التقرير نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
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
