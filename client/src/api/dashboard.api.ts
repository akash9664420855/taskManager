import { api } from './client';
import type { DashboardStats, RecentActivity, Task } from '@/types';

export const dashboardApi = {
  stats: () => api.get<{ stats: DashboardStats }>('/dashboard/stats').then((r) => r.data.stats),

  overdue: () => api.get<{ items: Task[] }>('/dashboard/overdue').then((r) => r.data.items),

  recent: () => api.get<RecentActivity>('/dashboard/recent').then((r) => r.data),
};
