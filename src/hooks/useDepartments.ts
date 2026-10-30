import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as departmentService from '../services/department.service';
import { toast } from 'react-hot-toast';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.listDepartments,
  });
};

export const useDepartment = (id?: string | null, params?: any) => {
  return useQuery({
    queryKey: ['department', id, params],
    queryFn: () => (id ? departmentService.getDepartment(id, params) : null),
    enabled: Boolean(id),
    retry: (failureCount, error: any) => {
      // Don't retry on 403 or 404
      if (error?.response?.status === 403 || error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['orgOverview'] });
      toast.success('تم إنشاء القسم بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنشاء القسم');
    }
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => departmentService.updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['orgOverview'] });
      toast.success('تم تحديث القسم بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تحديث القسم');
    }
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentService.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['orgOverview'] });
      toast.success('تم حذف القسم بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف القسم');
    }
  });
};
