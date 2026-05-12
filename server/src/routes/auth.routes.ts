import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import * as auth from '../controllers/auth.controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, validate({ body: signupSchema }), asyncHandler(auth.signup));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(auth.login));
router.post('/refresh', asyncHandler(auth.refresh));
router.post('/logout', asyncHandler(auth.logout));
router.get('/me', requireAuth, asyncHandler(auth.me));

export default router;
