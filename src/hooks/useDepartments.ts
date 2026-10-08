import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as departmentService from '../services/department.service';
import { toast } from 'react-hot-toast';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.listDepartments,
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
