import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { SaveReportButton } from '../../components/tool/SaveReportButton';
import axios from '@/lib/axios';

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

/** Fetch reports for the logged‑in user using authenticated axios */
const fetchUserReports = async ({ queryKey }: any): Promise<{ reports: Report[]; total: number }> => {
  const [_key, { page, limit }] = queryKey;
  const res = await axios.get(`/reports?skip=${(page - 1) * limit}&take=${limit}`);
  return res.data;
};

/** Delete a report */
const deleteReportApi = async (reportId: string) => {
  const res = await axios.delete(`/reports/${reportId}`);
  return res.data;
};

export const Reports: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  // React Query v5 requires object syntax
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['userReports', { page, limit }],
    queryFn: fetchUserReports,
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReportApi,
    onSuccess: () => {
      toast.success('تم حذف التقرير');
      queryClient.invalidateQueries({ queryKey: ['userReports'] });
    },
    onError: () => {
      toast.error('خطأ أثناء حذف التقرير');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف التقرير؟')) {
      deleteMutation.mutate(id);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (isLoading) return <p className="text-center my-8">جاري التحميل …</p>;
  if (isError) return <p className="text-center my-8 text-red-600">{(error as any).message}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">تقارير الجدوى الاقتصادية</h1>

      {/* Example usage of SaveReportButton for a new temporary report */}
      {/* <SaveReportButton reportContent={someReportContent} /> */}

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">الاسم</th>
            <th className="p-2 border">التاريخ</th>
            <th className="p-2 border">نوع النشاط</th>
            <th className="p-2 border">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {data?.reports?.length ? (
            data.reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  {report.projectName ?? `مشروع ${report.projectId}`}
                </td>
                <td className="p-2 border">
                  {new Date(report.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="p-2 border">
                  {report.activityType ?? '-'}
                </td>
                <td className="p-2 border space-x-2">
                  <a href={`/reports/${report.id}`} className="text-blue-600 hover:underline">
                    عرض كامل
                  </a>
                  {report.pdfPath && (
                    <a href={`/api/reports/${report.id}/download`} className="text-green-600 hover:underline">
                      تحميل PDF
                    </a>
                  )}
                  <button onClick={() => handleDelete(report.id)} className="text-red-600 hover:underline">
                    حذف
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-6 text-center text-gray-500">
                لا توجد تقارير بعد. قم بإنشاء دراسة جدوى لتظهر هنا.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          السابق
        </button>
        <span>
          الصفحة {page} من {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default Reports;
