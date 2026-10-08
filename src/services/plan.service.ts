import apiClient from "@/lib/axios";

export const listPlans = async (params?: { departmentId?: string; status?: string }) => {
  const { data } = await apiClient.get("/plans", { params });
  return data.data;
};

export const getPlan = async (id: string) => {
  const { data } = await apiClient.get(`/plans/${id}`);
  return data.data;
};

export const createPlan = async (payload: any) => {
  const { data } = await apiClient.post("/plans", payload);
  return data.data;
};

export const updatePlan = async (id: string, payload: any) => {
  const { data } = await apiClient.put(`/plans/${id}`, payload);
  return data.data;
};

export const deletePlan = async (id: string) => {
  const { data } = await apiClient.delete(`/plans/${id}`);
  return data.data;
};

export const listGoals = async (planId: string) => {
  const { data } = await apiClient.get(`/plans/${planId}/goals`);
  return data.data;
};

export const createGoal = async (planId: string, payload: any) => {
  const { data } = await apiClient.post(`/plans/${planId}/goals`, payload);
  return data.data;
};

export const updateGoal = async (planId: string, goalId: string, payload: any) => {
  const { data } = await apiClient.put(`/plans/${planId}/goals/${goalId}`, payload);
  return data.data;
};

export const deleteGoal = async (planId: string, goalId: string) => {
  const { data } = await apiClient.delete(`/plans/${planId}/goals/${goalId}`);
  return data.data;
};

export const getGoalCandidates = async (planId: string, runId?: string) => {
  const { data } = await apiClient.get(`/plans/${planId}/import/candidates`, { params: { runId } });
  return data.data;
};

export const importGoals = async (planId: string, payload: any) => {
  const { data } = await apiClient.post(`/plans/${planId}/import`, payload);
  return data.data;
};

export const listTasks = async (planId: string, params?: { goalId?: string; assignee?: string; status?: string }) => {
  const { data } = await apiClient.get(`/plans/${planId}/tasks`, { params });
  return data.data;
};

export const createTask = async (planId: string, payload: any) => {
  const { data } = await apiClient.post(`/plans/${planId}/tasks`, payload);
  return data.data;
};

export const updateTask = async (planId: string, taskId: string, payload: any) => {
  const { data } = await apiClient.put(`/plans/${planId}/tasks/${taskId}`, payload);
  return data.data;
};

export const deleteTask = async (planId: string, taskId: string) => {
  const { data } = await apiClient.delete(`/plans/${planId}/tasks/${taskId}`);
  return data.data;
};
