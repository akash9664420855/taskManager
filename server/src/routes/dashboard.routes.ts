import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/requireAuth';
import * as dashboard from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/stats', asyncHandler(dashboard.stats));
router.get('/overdue', asyncHandler(dashboard.overdue));
router.get('/recent', asyncHandler(dashboard.recent));

export default router;
