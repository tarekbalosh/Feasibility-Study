import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * /dashboard → redirects to /dashboard/Projects
 * This page acts as the entry point for the dashboard area.
 */
export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/Projects');
  }, [router]);

  return null;
}
