'use client';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast'; // adjust if using a different toast library
import { mapError } from '../utils/errorMessages';
import * as authService from '../services/auth.service';

// Base URL from environment (you can rename the variable as needed)
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api';

// Create Axios instance – withCredentials enables sending httpOnly refresh‑token cookie
const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

// ---------- Request interceptor ----------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Helper for retry (network errors only) ----------
// Only retry when there is NO response at all (connection refused, timeout)
// Never retry on 4xx / 5xx / 429 — those are server decisions
const isNetworkError = (error: any) => !error.response && Boolean(error.isAxiosError);

const retryRequest = async (error: AxiosError, retries = 2, baseDelay = 300): Promise<AxiosResponse | null> => {
  let attempt = 0;
  while (attempt < retries) {
    attempt += 1;
    await new Promise((res) => setTimeout(res, baseDelay * Math.pow(2, attempt - 1)));
    try {
      const { config } = error;
      if (!config) return null;
      return await api.request(config);
    } catch (e: any) {
      // If we now get an HTTP response (even an error), stop retrying
      if (e.response) break;
      if (!isNetworkError(e)) break;
      if (attempt === retries) return null;
    }
  }
  return null;
};

// ---------- Response interceptor ----------
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // 1️⃣ Retry on transient network errors
    if (isNetworkError(error) && originalRequest) {
      const retryResp = await retryRequest(error);
      if (retryResp) return retryResp;
    }

    // 2️⃣ Handle 401 – try to refresh token once
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;
      try {
        const newAccess = await authService.refreshToken(); // should return new JWT string
        if (newAccess) {
          localStorage.setItem('accessToken', newAccess);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api.request(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed → logout & redirect
        await authService.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    // 3️⃣ Unified error handling – map to Arabic message, show toast
    const friendly = mapError(error);
    toast.error(friendly);
    return Promise.reject(error);
  }
);

export default api;
