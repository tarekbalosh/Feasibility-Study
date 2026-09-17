import React, { useState } from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getUsers, updateUserStatus } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => getUsers({ page, limit: 10 }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'active'|'suspended' }) => updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  return (
    <AdminLayout>
      <Head>
        <title>المستخدمين - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المستخدمين</h1>
            <p className="text-gray-500 mt-1">إدارة مستخدمي المنصة</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">الاسم</th>
                  <th className="px-6 py-4 font-semibold">البريد الإلكتروني</th>
                  <th className="px-6 py-4 font-semibold">الدور</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold">الباقة</th>
                  <th className="px-6 py-4 font-semibold">تاريخ الانضمام</th>
                  <th className="px-6 py-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : data?.data?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'warning'}>
                        {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                        {user.status === 'active' ? 'نشط' : 'موقوف'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{user.subscriptionTier}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant={user.status === 'active' ? 'secondary' : 'primary'} 
                        className="text-xs px-3 py-1.5"
                        onClick={() => toggleStatus.mutate({ 
                          id: user.id, 
                          status: user.status === 'active' ? 'suspended' : 'active' 
                        })}
                        disabled={toggleStatus.isPending || user.role === 'admin'}
                      >
                        {user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </Button>
                    </td>
                  </tr>
                ))}
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
