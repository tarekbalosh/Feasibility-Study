import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWorkspace } from '@/context/WorkspaceContext';

/**
 * /dashboard → redirects to /dashboard/Overview for admins, /dashboard/Plans for members
 * This page acts as the entry point for the dashboard area.
 */
export default function DashboardIndex() {
  const router = useRouter();
  const { workspace, isLoading } = useWorkspace();

  useEffect(() => {
    if (isLoading) return;
    
    const isAdminOrOwner = workspace?.role === 'owner' || workspace?.role === 'admin';
    if (isAdminOrOwner) {
      router.replace('/dashboard/Overview');
    } else {
      router.replace('/dashboard/Plans');
    }
  }, [router, workspace, isLoading]);

  return null;
}
