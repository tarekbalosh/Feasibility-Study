import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { TeamMembersPanel } from '@/components/workspace/TeamMembersPanel';
import { AddTeamButton } from '@/components/workspace/AddTeamButton';
import { useWorkspace } from '@/context/WorkspaceContext';
import { canManageMembers } from '@/utils/permissions';

export default function Team() {
  const { workspace } = useWorkspace();
  const showInviteButton = workspace && canManageMembers(workspace.role);

  return (
    <DashboardLayout>
      <Head>
        <title>فريق العمل - أداة دراسة الجدوى</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">فريق العمل</h1>
            <p className="text-gray-500 mt-1">إدارة أعضاء مساحة العمل والدعوات المعلقة</p>
          </div>
          {showInviteButton && (
            <AddTeamButton className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm" />
          )}
        </div>

        <TeamMembersPanel />
      </div>
    </DashboardLayout>
  );
}
