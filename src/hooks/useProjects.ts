import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast'; // adjust if using another toast lib
import { getProjects, createProject, updateProject, deleteProject, Project } from '../services/projects.service';
import { mapError } from '../utils/errorMessages';

/** Fetch projects list */
export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });
};

/** Create project mutation */
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success('تم إنشاء المشروع');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error(mapError(error));
    },
  });
};

/** Update project mutation */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => updateProject(id, data),
    onSuccess: () => {
      toast.success('تم تعديل المشروع');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error(mapError(error));
    },
  });
};

/** Delete project mutation */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success('تم حذف المشروع');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error(mapError(error));
    },
  });
};

