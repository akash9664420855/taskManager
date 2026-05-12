import type { TaskStatus, TaskPriority, UserRole, ProjectStatus } from '@/lib/constants';

export type ID = string;

export interface User {
  _id: ID;
  id?: ID;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCounts {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  total: number;
}

export interface Project {
  _id: ID;
  id?: ID;
  name: string;
  description?: string;
  owner: User;
  members: User[];
  status: ProjectStatus;
  taskCounts?: TaskCounts;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: ID;
  id?: ID;
  title: string;
  description?: string;
  project: ID | { _id: ID; name: string };
  assignee?: User | null;
  createdBy: User;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: ID;
  id?: ID;
  task: ID;
  author: User;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: Record<string, string[]> | unknown;
  };
}

export interface DashboardStats {
  totalTasks: number;
  totalProjects: number;
  overdueCount: number;
  completedThisWeek: number;
  myOpenTasks: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}

export interface RecentActivity {
  recentTasks: Task[];
  recentComments: Array<{
    _id?: ID;
    body: string;
    createdAt: string;
    task: { _id: ID; title: string };
    author: { _id: ID; name: string; email: string; avatarUrl?: string };
  }>;
}
