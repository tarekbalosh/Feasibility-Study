import apiClient from "@/lib/axios";

export const listDepartments = async () => {
  const { data } = await apiClient.get("/departments");
  return data.data;
};

export const getDepartment = async (id: string) => {
  const { data } = await apiClient.get(`/departments/${id}`);
  return data.data;
};

export const createDepartment = async (payload: any) => {
  const { data } = await apiClient.post("/departments", payload);
  return data.data;
};

export const updateDepartment = async (id: string, payload: any) => {
  const { data } = await apiClient.put(`/departments/${id}`, payload);
  return data.data;
};

export const deleteDepartment = async (id: string) => {
  const { data } = await apiClient.delete(`/departments/${id}`);
  return data.data;
};
