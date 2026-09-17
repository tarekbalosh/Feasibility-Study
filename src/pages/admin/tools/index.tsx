import React from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getTools } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';

export default function AdminTools() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tools'],
    queryFn: getTools,
  });

  return (
    <AdminLayout>
      <Head>
        <title>الأدوات - لوحة الإدارة</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الأدوات</h1>
            <p className="text-gray-500 mt-1">إدارة أدوات الذكاء الاصطناعي المتاحة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : data?.data?.map((tool: any) => (
            <Card key={tool.id} className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {tool.creditCost} نقطة
                </span>
                <span className="text-gray-400">{tool.slug}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminAuth();
