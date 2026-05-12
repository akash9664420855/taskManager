import { z } from 'zod';
import { paginationQuery } from './common.schema';
import { USER_ROLES } from '../models/User';

export const listUsersQuery = paginationQuery.extend({
  q: z.string().trim().optional(),
  role: z.enum(USER_ROLES).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  role: z.enum(USER_ROLES).optional(),
});
