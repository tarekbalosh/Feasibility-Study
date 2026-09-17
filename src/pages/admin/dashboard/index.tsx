import React from 'react';
import { withAdminAuth } from '@/lib/adminAuth';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getOverview } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Users, Briefcase, FolderGit2, Activity, CreditCard } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getOverview,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AdminLayout>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          حدث خطأ أثناء تحميل البيانات. يرجى التأكد من صلاحياتك.
        </div>
      </AdminLayout>
    );
  }

  const stats = data.data;

  const statCards = [
    { title: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'مساحات العمل', value: stats.totalWorkspaces, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'إجمالي المشاريع', value: stats.totalProjects, icon: FolderGit2, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'عمليات الأدوات', value: stats.totalToolRuns, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'الإيرادات ($)', value: stats.revenue, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>لوحة الإدارة - Feasibility Suite</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
          <p className="text-gray-500 mt-1">إحصائيات النظام والأداء العام</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="p-6 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</h3>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminAuth();
