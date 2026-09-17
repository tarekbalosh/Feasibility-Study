import React, { useState } from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getToolRuns } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminToolRuns() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tool-runs', page],
    queryFn: () => getToolRuns({ page, limit: 10 }),
  });

  return (
    <AdminLayout>
      <Head>
        <title>سجل الأدوات - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل استخدام الأدوات</h1>
            <p className="text-gray-500 mt-1">تتبع عمليات توليد الذكاء الاصطناعي</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">المستخدم</th>
                  <th className="px-6 py-4 font-semibold">الأداة</th>
                  <th className="px-6 py-4 font-semibold">مساحة العمل</th>
                  <th className="px-6 py-4 font-semibold">تاريخ الاستخدام</th>
                  <th className="px-6 py-4 font-semibold">التكلفة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : data?.data?.map((run: any) => (
                  <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">
                      {run.user?.name} <br/>
                      <span className="text-xs text-gray-500">{run.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{run.tool?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{run.workspace?.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(run.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-600 font-medium">{run.creditCost} نقطة</span>
                    </td>
                  </tr>
                ))}
                {!isLoading && (!data?.data || data.data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">لا يوجد سجل استخدام</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {data?.pagination && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                إجمالي {data.pagination.total} عملية
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="text-xs px-3 py-1.5"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  className="text-xs px-3 py-1.5"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminAuth();
