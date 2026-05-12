import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken, type AccessPayload } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw ApiError.unauthorized('Empty access token');
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
};
