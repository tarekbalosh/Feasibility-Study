import axios from 'axios';

// Define standard axios for admin so we bypass the custom Bearer token logic
const adminApi = axios.create({
  baseURL: '/api/admin/proxy', // Points to the Next.js API proxy
});

export const getOverview = async () => {
  const { data } = await adminApi.get('/overview');
  return data;
};

export const getUsers = async (params: { page?: number; limit?: number; search?: string }) => {
  const { data } = await adminApi.get('/users', { params });
  return data;
};

export const getUserById = async (id: string) => {
  const { data } = await adminApi.get(`/users/${id}`);
  return data;
};

export const updateUserStatus = async (id: string, status: 'active' | 'suspended') => {
  const { data } = await adminApi.patch(`/users/${id}/status`, { status });
  return data;
};

export const getWorkspaces = async (params: { page?: number; limit?: number; search?: string }) => {
  const { data } = await adminApi.get('/workspaces', { params });
  return data;
};

export const getWorkspaceById = async (id: string) => {
  const { data } = await adminApi.get(`/workspaces/${id}`);
  return data;
};

export const getProjects = async (params: { page?: number; limit?: number }) => {
  const { data } = await adminApi.get('/projects', { params });
  return data;
};

export const getTools = async () => {
  const { data } = await adminApi.get('/tools');
  return data;
};

export const getToolRuns = async (params: { page?: number; limit?: number }) => {
  const { data } = await adminApi.get('/tool-runs', { params });
  return data;
};

export const getPayments = async (params: { page?: number; limit?: number }) => {
  const { data } = await adminApi.get('/payments', { params });
  return data;
};

export const getLimits = async (params: { page?: number; limit?: number }) => {
  const { data } = await adminApi.get('/limits', { params });
  return data;
};

export const updateUserLimit = async (userId: string, data: { generationsLimit?: number; generationsUsed?: number }) => {
  const { data: responseData } = await adminApi.patch(`/users/${userId}/limits`, data);
  return responseData;
};

export const getAuditLogs = async (params: { page?: number; limit?: number }) => {
  const { data } = await adminApi.get('/logs', { params });
  return data;
};
