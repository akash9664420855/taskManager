import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { requireProjectAccess } from '../middleware/requireProjectAccess';
import { idParam } from '../schemas/common.schema';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuery,
  memberBody,
  memberParams,
} from '../schemas/project.schema';
import * as projects from '../controllers/projects.controller';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listProjectsQuery }), asyncHandler(projects.listProjects));
router.post(
  '/',
  requireRole(['admin', 'manager']),
  validate({ body: createProjectSchema }),
  asyncHandler(projects.createProject),
);
router.get('/:id', validate({ params: idParam }), requireProjectAccess('member'), asyncHandler(projects.getProject));
router.patch(
  '/:id',
  validate({ params: idParam, body: updateProjectSchema }),
  requireProjectAccess('owner'),
  asyncHandler(projects.updateProject),
);
router.delete(
  '/:id',
  validate({ params: idParam }),
  requireProjectAccess('owner'),
  asyncHandler(projects.deleteProject),
);
router.post(
  '/:id/members',
  validate({ params: idParam, body: memberBody }),
  requireProjectAccess('owner'),
  asyncHandler(projects.addMember),
);
router.delete(
  '/:id/members/:userId',
  validate({ params: memberParams }),
  requireProjectAccess('owner'),
  asyncHandler(projects.removeMember),
);

export default router;
