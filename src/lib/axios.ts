'use client';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast'; // adjust if using a different toast library
import { mapError } from '../utils/errorMessages';
import * as authService from '../services/auth.service';

// API URL – falls back to production if NEXT_PUBLIC_API_BASE_URL is not set
const PRODUCTION_API_URL = 'https://feasibility-study.onrender.com/api';
let baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || PRODUCTION_API_URL;

// Fix for incorrect Vercel environment variable pointing to the frontend URL
if (baseURL.includes('vercel.app') && !baseURL.includes('/api')) {
  baseURL = PRODUCTION_API_URL;
}

// Create Axios instance – withCredentials enables sending httpOnly refresh‑token cookie
const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000, // Increased to 60s to allow Render free tier backend to wake up
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
const isNetworkError = (error: any) => 
  !error.response && 
  Boolean(error.isAxiosError) && 
  error.code !== 'ERR_CANCELED' && 
  !axios.isCancel(error);

// ---------- Response interceptor ----------
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthEndpoint = url.includes('/auth/');

    // 1️⃣ Retry on transient network errors — but NEVER for auth endpoints
    if (!isAuthEndpoint) {
      const retryCount = (originalRequest as any)?._retryCount || 0;
      if (isNetworkError(error) && originalRequest && retryCount < 2) {
        (originalRequest as any)._retryCount = retryCount + 1;
        await new Promise((res) => setTimeout(res, 300 * Math.pow(2, retryCount)));
        return api.request(originalRequest);
      }
    }

    // 2️⃣ Handle 401 – try to refresh token once (skip for login/register/refresh endpoints)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !isAuthEndpoint &&
      !(originalRequest as any)._retry
    ) {
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
    //    Skip toast for auth endpoints (they handle their own error UI)
    if (!isAuthEndpoint) {
      const friendly = mapError(error);
      toast.error(friendly);
    }
    return Promise.reject(error);
  }
);

export default api;
