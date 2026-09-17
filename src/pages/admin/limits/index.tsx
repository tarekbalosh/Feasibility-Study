import React, { useState } from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getLimits } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminLimits() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-limits', page],
    queryFn: () => getLimits({ page, limit: 10 }),
  });

  return (
    <AdminLayout>
      <Head>
        <title>حدود الاستخدام - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">حدود الاستخدام</h1>
            <p className="text-gray-500 mt-1">تتبع استهلاك النقاط وحدود التوليد للمستخدمين</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">المستخدم</th>
                  <th className="px-6 py-4 font-semibold">المستخدم / الإجمالي</th>
                  <th className="px-6 py-4 font-semibold">نسبة الاستهلاك</th>
                  <th className="px-6 py-4 font-semibold">الباقة الحالية</th>
                  <th className="px-6 py-4 font-semibold">حالة الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : data?.data?.map((limitItem: any) => {
                  const percentage = limitItem.generationsLimit > 0 
                    ? Math.round((limitItem.generationsUsed / limitItem.generationsLimit) * 100) 
                    : 0;
                    
                  return (
                    <tr key={limitItem.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">
                        {limitItem.user?.name || 'غير معروف'} <br/>
                        <span className="text-xs text-gray-500">{limitItem.user?.email || 'لا يوجد بريد'}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <span className={percentage >= 90 ? 'text-red-600' : 'text-gray-900'}>
                          {limitItem.generationsUsed}
                        </span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-gray-600">{limitItem.generationsLimit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[150px]">
                          <div 
                            className={`h-2.5 rounded-full ${
                              percentage >= 90 ? 'bg-red-600' : 
                              percentage >= 75 ? 'bg-yellow-400' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">{percentage}%</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        مخصص
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          نشط
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && (!data?.data || data.data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">لا توجد بيانات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {data?.pagination && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                إجمالي {data.pagination.total} مستخدم
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
