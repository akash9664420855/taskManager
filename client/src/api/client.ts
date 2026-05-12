import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20_000,
});

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

let refreshInflight: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (!refreshInflight) {
    refreshInflight = axios
      .post<{ accessToken: string; user: unknown }>('/api/auth/refresh', null, {
        withCredentials: true,
        timeout: 15_000,
      })
      .then((res) => {
        const { accessToken, user } = res.data;
        useAuthStore.getState().setSession(user as never, accessToken);
        return accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return null;
      })
      .finally(() => {
        refreshInflight = null;
      });
  }
  return refreshInflight;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';

    if (
      err.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/signup') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original as AxiosRequestConfig);
      }
    }
    return Promise.reject(err);
  },
);

export function extractApiError(err: unknown): {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
} {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string; code?: string; details?: Record<string, string[]> } }
      | undefined;
    if (data?.error) {
      return {
        message: data.error.message ?? 'Something went wrong',
        code: data.error.code,
        fieldErrors: data.error.details,
      };
    }
    return { message: err.message || 'Network error' };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: 'Unknown error' };
}
