import { api } from './client';
import type { Paginated, Comment } from '@/types';

export const commentsApi = {
  list: (taskId: string, params: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<Comment>>(`/tasks/${taskId}/comments`, { params }).then((r) => r.data),

  create: (taskId: string, body: string) =>
    api.post<{ comment: Comment }>(`/tasks/${taskId}/comments`, { body }).then((r) => r.data.comment),

  remove: (id: string) => api.delete<void>(`/comments/${id}`).then(() => undefined),
};
