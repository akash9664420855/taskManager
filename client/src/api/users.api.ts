import { api } from './client';
import type { Paginated, User } from '@/types';
import type { UserRole } from '@/lib/constants';

export const usersApi = {
  list: (params: { page?: number; limit?: number; q?: string; role?: UserRole } = {}) =>
    api.get<Paginated<User>>('/users', { params }).then((r) => r.data),

  get: (id: string) => api.get<{ user: User }>(`/users/${id}`).then((r) => r.data.user),

  update: (id: string, input: { name?: string; role?: UserRole }) =>
    api.patch<{ user: User }>(`/users/${id}`, input).then((r) => r.data.user),

  remove: (id: string) => api.delete<void>(`/users/${id}`).then(() => undefined),
};
