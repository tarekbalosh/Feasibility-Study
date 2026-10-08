import apiClient from "@/lib/axios";

export const getOrgContext = async () => {
  const { data } = await apiClient.get("/org/context");
  return data.data;
};

export const getOrgOverview = async () => {
  const { data } = await apiClient.get("/org/overview");
  return data.data;
};

export const listOrgMembers = async () => {
  const { data } = await apiClient.get("/org/members");
  return data.data;
};
