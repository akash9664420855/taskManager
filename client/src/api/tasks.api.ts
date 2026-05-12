import { api } from './client';
import type { Paginated, Task } from '@/types';
import type { TaskStatus, TaskPriority } from '@/lib/constants';

export interface ListTasksParams {
  page?: number;
  limit?: number;
  project?: string;
  assignee?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  q?: string;
  sort?: 'createdAt' | '-createdAt' | 'dueDate' | '-dueDate' | 'priority';
  mine?: boolean;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  project: string;
  assignee?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignee?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export const tasksApi = {
  list: (params: ListTasksParams = {}) =>
    api.get<Paginated<Task>>('/tasks', { params }).then((r) => r.data),

  get: (id: string) => api.get<{ task: Task }>(`/tasks/${id}`).then((r) => r.data.task),

  create: (input: CreateTaskInput) =>
    api.post<{ task: Task }>('/tasks', input).then((r) => r.data.task),

  update: (id: string, input: UpdateTaskInput) =>
    api.patch<{ task: Task }>(`/tasks/${id}`, input).then((r) => r.data.task),

  updateStatus: (id: string, status: TaskStatus) =>
    api.patch<{ task: Task }>(`/tasks/${id}/status`, { status }).then((r) => r.data.task),

  remove: (id: string) => api.delete<void>(`/tasks/${id}`).then(() => undefined),
};
