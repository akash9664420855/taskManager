import { api } from './client';
import type { User } from '@/types';

export interface AuthResult {
  user: User;
  accessToken: string;
}

export const authApi = {
  signup: (input: { name: string; email: string; password: string }) =>
    api.post<AuthResult>('/auth/signup', input).then((r) => r.data),

  login: (input: { email: string; password: string }) =>
    api.post<AuthResult>('/auth/login', input).then((r) => r.data),

  refresh: () => api.post<AuthResult>('/auth/refresh').then((r) => r.data),

  logout: () => api.post<void>('/auth/logout').then(() => undefined),

  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
