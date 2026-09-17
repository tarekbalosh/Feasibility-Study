import React, { useState } from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getAuditLogs } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: () => getAuditLogs({ page, limit: 15 }),
  });

  return (
    <AdminLayout>
      <Head>
        <title>سجل النشاطات - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل النشاطات</h1>
            <p className="text-gray-500 mt-1">تتبع نشاطات النظام والمديرين</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">الإجراء</th>
                  <th className="px-6 py-4 font-semibold">الكيان المرتبط</th>
                  <th className="px-6 py-4 font-semibold">المدير/المسؤول</th>
                  <th className="px-6 py-4 font-semibold">التفاصيل</th>
                  <th className="px-6 py-4 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : data?.data?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {log.entityType} <br/>
                      <span className="text-xs text-gray-400">{log.entityId}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {log.adminId === 'SYSTEM_ADMIN' ? 'مدير النظام' : log.adminId}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))}
                {!isLoading && (!data?.data || data.data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">لا يوجد سجل نشاطات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {data?.pagination && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                إجمالي {data.pagination.total} سجل
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
