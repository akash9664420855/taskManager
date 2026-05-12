import { z } from 'zod';
import { paginationQuery } from './common.schema';

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

export const listCommentsQuery = paginationQuery;
