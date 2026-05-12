import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants';

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is too short').max(120, 'Title is too long'),
  description: z.string().trim().max(2000).optional().default(''),
  project: z.string().min(1, 'Project is required'),
  assignee: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().optional().nullable(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
