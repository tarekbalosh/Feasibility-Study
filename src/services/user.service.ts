import api from '../lib/axios';

/** Get current user's profile */
export const getProfile = async (): Promise<any> => {
  const res = await api.get('/user/profile');
  return res.data;
};

/** Update current user's profile */
export const updateProfile = async (payload: any): Promise<any> => {
  const res = await api.put('/user/profile', payload);
  return res.data;
};

/** Change password */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await api.post('/user/change-password', { oldPassword, newPassword });
};
