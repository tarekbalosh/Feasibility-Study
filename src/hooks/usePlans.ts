import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as planService from '../services/plan.service';
import { toast } from 'react-hot-toast';

export const usePlans = (params?: { departmentId?: string; status?: string }) => {
  return useQuery({
    queryKey: ['plans', params],
    queryFn: () => planService.listPlans(params),
  });
};

export const usePlan = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => planService.getPlan(id),
    enabled: !!id && enabled,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: planService.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['orgOverview'] });
      toast.success('تم إنشاء الخطة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنشاء الخطة');
    }
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: planService.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['orgOverview'] });
      toast.success('تم حذف الخطة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف الخطة');
    }
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => planService.updatePlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['orgOverview'] });
      toast.success('تم تحديث الخطة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تحديث الخطة');
    }
  });
};

export const useGoals = (planId: string) => {
  return useQuery({
    queryKey: ['plans', planId, 'goals'],
    queryFn: () => planService.listGoals(planId),
    enabled: !!planId,
  });
};

export const useTasks = (planId: string, params?: { goalId?: string }) => {
  return useQuery({
    queryKey: ['plans', planId, 'tasks', params],
    queryFn: () => planService.listTasks(planId, params),
    enabled: !!planId,
  });
};

export const usePlanSheet = (planId: string | null, filters?: planService.SheetFilterParams) => {
  return useQuery({
    queryKey: ['plans', planId ?? 'all', 'sheet', filters],
    queryFn: () => planService.getPlanSheet(planId, filters),
    placeholderData: (prev) => prev,
  });
};

const sheetError = (error: any) =>
  error?.response?.data?.message || 'تعذّر الحفظ، حاول مرة أخرى';

/** حفظ تعديل خلية داخل الجدول — يُعاد جلب الجدول بعده ليظهر ما قبله الخادم فعلاً */
export const useUpdateSheetTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, taskId, payload }: { planId: string; taskId: string; payload: any }) =>
      planService.updateTask(planId, taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('تم الحفظ');
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.error(sheetError(error));
    },
  });
};

/** إضافة هدف و/أو مهمة من نافذة واحدة */
export const useAddGoalMeans = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (v: { planId: string; goalId?: string; goal?: any; task: any }) => {
      let goalId = v.goalId;
      if (!goalId && v.goal) goalId = (await planService.createGoal(v.planId, v.goal)).id;
      if (v.task?.title) return planService.createTask(v.planId, { ...v.task, goalId });
      return { goalId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('تمت الإضافة');
    },
    onError: (error: any) => toast.error(sheetError(error)),
  });
};

