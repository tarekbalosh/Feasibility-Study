import api from '../lib/axios';
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://feasibility-study.onrender.com/api';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  data?: any;
}

/** Register new user */
export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/register', payload);
  if (res.data.token) {
    localStorage.setItem('accessToken', res.data.token);
    if (res.data.refreshToken) {
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
  }
  return res.data;
};

/** Login existing user */
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', payload);
  if (res.data.token) {
    localStorage.setItem('accessToken', res.data.token);
    if (res.data.refreshToken) {
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
  }
  return res.data;
};

/** Logout – clear client token and call backend if needed */
export const logout = async (): Promise<void> => {
  try {
    // We use plain axios here as well to avoid infinite loops if it fails
    await axios.post(`${baseURL}/auth/logout`);
  } catch (e) {
    // Ignore error if logout fails
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

/** Request password reset */
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

/** Reset password using token */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post('/auth/reset-password', { token, newPassword });
};

/** Refresh access token – returns new token string */
export const refreshToken = async (): Promise<string> => {
  const currentRefreshToken = localStorage.getItem('refreshToken');
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  // Use plain axios to avoid interceptor infinite loops
  const res = await axios.post<{ success: boolean; token: string; refreshToken: string }>(
    `${baseURL}/auth/refresh-token`,
    { refreshToken: currentRefreshToken }
  );

  const newToken = res.data.token;
  const newRefreshToken = res.data.refreshToken;

  if (newToken) {
    localStorage.setItem('accessToken', newToken);
  }
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken);
  }
  return newToken;
};
