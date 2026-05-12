import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { idParam } from '../schemas/common.schema';
import { listUsersQuery, updateUserSchema } from '../schemas/user.schema';
import * as users from '../controllers/users.controller';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole(['admin']), validate({ query: listUsersQuery }), asyncHandler(users.listUsers));
router.get('/:id', requireRole(['admin']), validate({ params: idParam }), asyncHandler(users.getUser));
router.patch(
  '/:id',
  requireRole(['admin']),
  validate({ params: idParam, body: updateUserSchema }),
  asyncHandler(users.updateUser),
);
router.delete('/:id', requireRole(['admin']), validate({ params: idParam }), asyncHandler(users.deleteUser));

export default router;
