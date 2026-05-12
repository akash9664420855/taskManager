import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import projectsRoutes from './projects.routes';
import tasksRoutes from './tasks.routes';
import commentsRoutes from './comments.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use(commentsRoutes); // mounts /tasks/:taskId/comments and /comments/:id
router.use('/dashboard', dashboardRoutes);

export default router;
