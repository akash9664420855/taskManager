import { api } from './client';
import type { Paginated, Project } from '@/types';

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: 'active' | 'archived';
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  members?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'active' | 'archived';
}

export const projectsApi = {
  list: (params: ListProjectsParams = {}) =>
    api.get<Paginated<Project>>('/projects', { params }).then((r) => r.data),

  get: (id: string) => api.get<{ project: Project }>(`/projects/${id}`).then((r) => r.data.project),

  create: (input: CreateProjectInput) =>
    api.post<{ project: Project }>('/projects', input).then((r) => r.data.project),

  update: (id: string, input: UpdateProjectInput) =>
    api.patch<{ project: Project }>(`/projects/${id}`, input).then((r) => r.data.project),

  remove: (id: string) => api.delete<void>(`/projects/${id}`).then(() => undefined),

  addMember: (id: string, userId: string) =>
    api
      .post<{ project: Project }>(`/projects/${id}/members`, { userId })
      .then((r) => r.data.project),

  removeMember: (id: string, userId: string) =>
    api
      .delete<{ project: Project }>(`/projects/${id}/members/${userId}`)
      .then((r) => r.data.project),
};
