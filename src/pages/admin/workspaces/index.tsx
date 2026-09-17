import React, { useState } from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getWorkspaces } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminWorkspaces() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-workspaces', page],
    queryFn: () => getWorkspaces({ page, limit: 10 }),
  });

  return (
    <AdminLayout>
      <Head>
        <title>مساحات العمل - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مساحات العمل</h1>
            <p className="text-gray-500 mt-1">إدارة مساحات العمل على المنصة</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">اسم مساحة العمل</th>
                  <th className="px-6 py-4 font-semibold">المالك</th>
                  <th className="px-6 py-4 font-semibold">تاريخ الإنشاء</th>
                  <th className="px-6 py-4 font-semibold">الأعضاء</th>
                  <th className="px-6 py-4 font-semibold">الأدوات المستخدمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : data?.data?.map((workspace: any) => (
                  <tr key={workspace.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{workspace.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {workspace.owner?.name} <br/>
                      <span className="text-xs text-gray-400">{workspace.owner?.email}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(workspace.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{workspace._count?.members}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{workspace._count?.toolRuns}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data?.pagination && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                إجمالي {data.pagination.total} مساحة عمل
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
