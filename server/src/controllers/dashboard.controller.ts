import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Comment } from '../models/Comment';
import { ApiError } from '../utils/ApiError';

async function scopedProjectIds(user: { sub: string; role: 'admin' | 'manager' | 'member' }) {
  if (user.role === 'admin') return null;
  const userId = new mongoose.Types.ObjectId(user.sub);
  const projects = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  }).select('_id');
  return projects.map((p) => p._id);
}

export async function stats(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const scope = await scopedProjectIds(req.user);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const taskFilter: Record<string, unknown> = {};
  if (scope) taskFilter.project = { $in: scope };

  const [byStatusRaw, byPriorityRaw, totalTasks, overdueCount, completedThisWeek, projectCount, myAssignedRaw] =
    await Promise.all([
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, dueDate: { $lt: now }, status: { $ne: 'done' } }),
      Task.countDocuments({ ...taskFilter, status: 'done', completedAt: { $gte: startOfWeek } }),
      scope ? scope.length : Project.countDocuments({}),
      Task.aggregate([
        {
          $match: {
            ...taskFilter,
            assignee: new mongoose.Types.ObjectId(req.user.sub),
            status: { $ne: 'done' },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

  const statusCounts: Record<string, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  for (const row of byStatusRaw) statusCounts[row._id as string] = row.count;

  const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
  for (const row of byPriorityRaw) priorityCounts[row._id as string] = row.count;

  const myOpen = myAssignedRaw.reduce((sum, r) => sum + r.count, 0);

  res.json({
    stats: {
      totalTasks,
      totalProjects: projectCount,
      overdueCount,
      completedThisWeek,
      myOpenTasks: myOpen,
      byStatus: statusCounts,
      byPriority: priorityCounts,
    },
  });
}

export async function overdue(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const scope = await scopedProjectIds(req.user);
  const filter: Record<string, unknown> = {
    dueDate: { $lt: new Date() },
    status: { $ne: 'done' },
  };
  if (scope) filter.project = { $in: scope };

  const items = await Task.find(filter)
    .populate('assignee', 'name email avatarUrl role')
    .populate('project', 'name')
    .sort({ dueDate: 1 })
    .limit(10);

  res.json({ items: items.map((t) => t.toJSON()) });
}

export async function recent(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const scope = await scopedProjectIds(req.user);
  const taskFilter: Record<string, unknown> = {};
  if (scope) taskFilter.project = { $in: scope };

  const [tasks, comments] = await Promise.all([
    Task.find(taskFilter)
      .populate('assignee', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(8),
    scope
      ? Comment.aggregate([
          {
            $lookup: {
              from: 'tasks',
              localField: 'task',
              foreignField: '_id',
              as: 'taskDoc',
            },
          },
          { $unwind: '$taskDoc' },
          { $match: { 'taskDoc.project': { $in: scope } } },
          { $sort: { createdAt: -1 } },
          { $limit: 8 },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'authorDoc',
            },
          },
          { $unwind: '$authorDoc' },
          {
            $project: {
              body: 1,
              createdAt: 1,
              task: { _id: '$taskDoc._id', title: '$taskDoc.title' },
              author: {
                _id: '$authorDoc._id',
                name: '$authorDoc.name',
                email: '$authorDoc.email',
                avatarUrl: '$authorDoc.avatarUrl',
              },
            },
          },
        ])
      : Comment.find({})
          .populate('author', 'name email avatarUrl role')
          .populate('task', 'title')
          .sort({ createdAt: -1 })
          .limit(8)
          .then((items) => items.map((c) => c.toJSON())),
  ]);

  res.json({
    recentTasks: tasks.map((t) => t.toJSON()),
    recentComments: comments,
  });
}
