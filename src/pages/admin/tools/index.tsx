import React from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getTools } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getAllTools, TOOL_STATUS_LABELS } from '@/config/tools.registry';

export default function AdminTools() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tools'],
    queryFn: getTools,
  });

  const tools = getAllTools();
  const toolStats = data?.data || [];

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
          {tools.map((tool) => {
            const stats = toolStats.find((s: any) => s.toolSlug === tool.slug);
            const usageCount = stats?._count?.id || 0;
            
            return (
              <Card key={tool.slug} className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${tool.accent.bg} ${tool.accent.text}`}>
                    <tool.icon size={24} />
                  </div>
                  <Badge variant={tool.status === 'live' ? 'success' : tool.status === 'beta' ? 'warning' : 'default'}>
                    {TOOL_STATUS_LABELS[tool.status]}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-500 mb-6 flex-grow">{tool.shortDescription}</p>
                
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">حالة الدخول:</span>
                    <span className={tool.requiresAuth ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
                      {tool.requiresAuth ? "يتطلب تسجيل" : "متاح للجميع"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">مرات الاستخدام:</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {isLoading ? '...' : usageCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-400 font-mono text-xs truncate max-w-full">{tool.slug}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminAuth();
