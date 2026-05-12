import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '../models/User';

export const requireRole = (roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
};
