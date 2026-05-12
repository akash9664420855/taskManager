import { z } from 'zod';
import { objectId, paginationQuery } from './common.schema';
import { PROJECT_STATUSES } from '../models/Project';

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(''),
  members: z.array(objectId).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const listProjectsQuery = paginationQuery.extend({
  q: z.string().trim().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const memberBody = z.object({ userId: objectId });
export const memberParams = z.object({ id: objectId, userId: objectId });
