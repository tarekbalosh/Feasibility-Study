import { useQuery } from '@tanstack/react-query';
import { getOrgContext, getOrgOverview, listOrgMembers } from '../services/org.service';

export const useOrgContext = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orgContext'],
    queryFn: getOrgContext,
    enabled,
  });
};

export const useOrgOverview = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orgOverview'],
    queryFn: getOrgOverview,
    enabled,
  });
};

export const useOrgMembers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orgMembers'],
    queryFn: listOrgMembers,
    enabled,
  });
};
