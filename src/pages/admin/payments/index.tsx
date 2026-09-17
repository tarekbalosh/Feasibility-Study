import React, { useState } from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getPayments } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminPayments() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: () => getPayments({ page, limit: 10 }),
  });

  return (
    <AdminLayout>
      <Head>
        <title>المدفوعات - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المدفوعات</h1>
            <p className="text-gray-500 mt-1">تتبع العمليات المالية والاشتراكات</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">المستخدم</th>
                  <th className="px-6 py-4 font-semibold">المبلغ</th>
                  <th className="px-6 py-4 font-semibold">الباقة</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : data?.data?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">
                      {payment.user?.name} <br/>
                      <span className="text-xs text-gray-500">{payment.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {payment.amount} {payment.currency || 'SAR'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{payment.plan?.name || 'مخصص'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'completed' || payment.status === 'success' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'completed' || payment.status === 'success' ? 'ناجحة' :
                         payment.status === 'pending' ? 'قيد الانتظار' : 'فشلت'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(payment.createdAt).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))}
                {!isLoading && (!data?.data || data.data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">لا توجد مدفوعات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {data?.pagination && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                إجمالي {data.pagination.total} عملية دفع
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
