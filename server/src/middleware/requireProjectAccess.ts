import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { Project, type ProjectDoc } from '../models/Project';
import { ApiError } from '../utils/ApiError';

export type ProjectAccessLevel = 'member' | 'owner';

/**
 * Loads the project from `req.params.id` (or `req.params.projectId`) and verifies
 * the caller has the required level of access. Attaches the project to `req.project`.
 *
 * - Admin: always allowed
 * - Owner level: only project owner or admin
 * - Member level: owner OR member, or admin
 */
export const requireProjectAccess = (level: ProjectAccessLevel = 'member'): RequestHandler => {
  return async (req, _res, next) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const id = req.params.id ?? req.params.projectId;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest('Invalid project id');
      }
      const project = await Project.findById(id);
      if (!project) throw ApiError.notFound('Project not found');

      const userId = req.user.sub;
      const isAdmin = req.user.role === 'admin';
      const isOwner = project.owner.toString() === userId;
      const isMember = project.members.some((m) => m.toString() === userId);

      if (isAdmin) {
        req.project = project;
        return next();
      }
      if (level === 'owner' && !isOwner) {
        throw ApiError.forbidden('Only the project owner can do that');
      }
      if (level === 'member' && !isOwner && !isMember) {
        throw ApiError.forbidden('You are not a member of this project');
      }
      req.project = project;
      next();
    } catch (err) {
      next(err);
    }
  };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      project?: ProjectDoc;
    }
  }
}
