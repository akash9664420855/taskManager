import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { ApiError } from '../utils/ApiError';

async function loadTaskForComment(taskId: string, user: { sub: string; role: 'admin' | 'manager' | 'member' }) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) throw ApiError.badRequest('Invalid task id');
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  const project = await Project.findById(task.project);
  if (!project) throw ApiError.notFound('Project not found');
  const isMember =
    project.owner.toString() === user.sub ||
    (project.members?.some((m) => m.toString() === user.sub) ?? false);
  if (user.role !== 'admin' && !isMember) {
    throw ApiError.forbidden('You do not have access to that task');
  }
  return { task, project };
}

export async function listComments(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  await loadTaskForComment(req.params.taskId, req.user);
  const pageN = Number(req.query.page ?? 1);
  const limitN = Number(req.query.limit ?? 50);

  const [items, total] = await Promise.all([
    Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatarUrl role')
      .sort({ createdAt: 1 })
      .skip((pageN - 1) * limitN)
      .limit(limitN),
    Comment.countDocuments({ task: req.params.taskId }),
  ]);

  res.json({
    items: items.map((c) => c.toJSON()),
    page: pageN,
    limit: limitN,
    total,
    pages: Math.ceil(total / limitN),
  });
}

export async function createComment(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { task } = await loadTaskForComment(req.params.taskId, req.user);
  const { body } = req.body as { body: string };

  const created = await Comment.create({ task: task._id, author: req.user.sub, body });
  const populated = await Comment.findById(created._id).populate('author', 'name email avatarUrl role');
  res.status(201).json({ comment: populated!.toJSON() });
}

export async function deleteComment(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw ApiError.badRequest('Invalid id');
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (req.user.role !== 'admin' && comment.author.toString() !== req.user.sub) {
    throw ApiError.forbidden('Only the author or an admin can delete this comment');
  }
  await comment.deleteOne();
  res.status(204).end();
}
