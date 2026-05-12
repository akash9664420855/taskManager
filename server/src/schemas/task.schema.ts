import { z } from 'zod';
import { objectId, paginationQuery } from './common.schema';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task';

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  project: objectId,
  assignee: objectId.optional().nullable(),
  status: z.enum(TASK_STATUSES).optional().default('todo'),
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  assignee: objectId.optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const listTasksQuery = paginationQuery.extend({
  project: objectId.optional(),
  assignee: objectId.optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  overdue: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v ? v === 'true' : undefined)),
  q: z.string().trim().optional(),
  sort: z.enum(['createdAt', '-createdAt', 'dueDate', '-dueDate', 'priority']).optional(),
  mine: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v ? v === 'true' : undefined)),
});
