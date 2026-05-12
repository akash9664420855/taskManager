import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { objectId, idParam } from '../schemas/common.schema';
import { createCommentSchema, listCommentsQuery } from '../schemas/comment.schema';
import * as comments from '../controllers/comments.controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);

const taskIdParams = z.object({ taskId: objectId });

router.get(
  '/tasks/:taskId/comments',
  validate({ params: taskIdParams, query: listCommentsQuery }),
  asyncHandler(comments.listComments),
);
router.post(
  '/tasks/:taskId/comments',
  validate({ params: taskIdParams, body: createCommentSchema }),
  asyncHandler(comments.createComment),
);
router.delete('/comments/:id', validate({ params: idParam }), asyncHandler(comments.deleteComment));

export default router;
