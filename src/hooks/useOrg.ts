import { useQuery } from '@tanstack/react-query';
import { getOrgContext, getOrgOverview, listOrgMembers } from '../services/org.service';

export const useOrgContext = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orgContext'],
    queryFn: getOrgContext,
    enabled,
  });
};

export const useOrgOverview = (workspaceId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orgOverview', workspaceId],
    queryFn: getOrgOverview,
    enabled: enabled && Boolean(workspaceId),
  });
};

export const useOrgMembers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orgMembers'],
    queryFn: listOrgMembers,
    enabled,
  });
};
