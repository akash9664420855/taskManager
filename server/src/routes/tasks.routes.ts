import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { idParam } from '../schemas/common.schema';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  listTasksQuery,
} from '../schemas/task.schema';
import * as tasks from '../controllers/tasks.controller';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listTasksQuery }), asyncHandler(tasks.listTasks));
router.post('/', validate({ body: createTaskSchema }), asyncHandler(tasks.createTask));
router.get('/:id', validate({ params: idParam }), asyncHandler(tasks.getTask));
router.patch('/:id', validate({ params: idParam, body: updateTaskSchema }), asyncHandler(tasks.updateTask));
router.patch(
  '/:id/status',
  validate({ params: idParam, body: updateTaskStatusSchema }),
  asyncHandler(tasks.updateTaskStatus),
);
router.delete('/:id', validate({ params: idParam }), asyncHandler(tasks.deleteTask));

export default router;
