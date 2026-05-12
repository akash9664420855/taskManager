import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long'),
  description: z.string().trim().max(500, 'Keep it under 500 characters').optional().default(''),
  members: z.array(z.string()).default([]),
});
export type ProjectForm = z.infer<typeof projectFormSchema>;
