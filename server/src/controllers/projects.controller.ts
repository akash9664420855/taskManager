import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export async function listProjects(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { page = 1, limit = 20, q, status } = req.query as Record<string, string | undefined>;
  const pageN = Number(page);
  const limitN = Number(limit);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

  if (req.user.role !== 'admin') {
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    filter.$and = [
      filter.$or ? { $or: filter.$or } : {},
      { $or: [{ owner: userId }, { members: userId }] },
    ].filter((c) => Object.keys(c).length > 0);
    delete filter.$or;
  }

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email avatarUrl role')
      .populate('members', 'name email avatarUrl role')
      .sort({ updatedAt: -1 })
      .skip((pageN - 1) * limitN)
      .limit(limitN),
    Project.countDocuments(filter),
  ]);

  // Augment with task counts
  const ids = items.map((p) => p._id);
  const counts = await Task.aggregate([
    { $match: { project: { $in: ids } } },
    {
      $group: {
        _id: { project: '$project', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);
  const countMap = new Map<string, Record<string, number>>();
  for (const c of counts) {
    const key = c._id.project.toString();
    if (!countMap.has(key)) countMap.set(key, { todo: 0, in_progress: 0, in_review: 0, done: 0, total: 0 });
    const m = countMap.get(key)!;
    m[c._id.status] = c.count;
    m.total += c.count;
  }

  res.json({
    items: items.map((p) => ({
      ...p.toJSON(),
      taskCounts: countMap.get(p._id.toString()) ?? { todo: 0, in_progress: 0, in_review: 0, done: 0, total: 0 },
    })),
    page: pageN,
    limit: limitN,
    total,
    pages: Math.ceil(total / limitN),
  });
}

export async function getProject(req: Request, res: Response) {
  // requireProjectAccess middleware loaded req.project
  const project = req.project!;
  const populated = await Project.findById(project._id)
    .populate('owner', 'name email avatarUrl role')
    .populate('members', 'name email avatarUrl role');
  if (!populated) throw ApiError.notFound('Project not found');

  const taskCounts = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0, total: 0 };
  for (const c of taskCounts) {
    counts[c._id as string] = c.count;
    counts.total += c.count;
  }

  res.json({ project: { ...populated.toJSON(), taskCounts: counts } });
}

export async function createProject(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { name, description, members = [] } = req.body as {
    name: string;
    description?: string;
    members?: string[];
  };

  // Validate every member exists
  if (members.length > 0) {
    const found = await User.countDocuments({ _id: { $in: members } });
    if (found !== members.length) throw ApiError.badRequest('One or more members do not exist');
  }

  const project = await Project.create({
    name,
    description: description ?? '',
    owner: req.user.sub,
    members: Array.from(new Set([req.user.sub, ...members])),
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'name email avatarUrl role')
    .populate('members', 'name email avatarUrl role');

  res.status(201).json({ project: populated!.toJSON() });
}

export async function updateProject(req: Request, res: Response) {
  const project = req.project!;
  if (req.body.name !== undefined) project.name = req.body.name;
  if (req.body.description !== undefined) project.description = req.body.description;
  if (req.body.status !== undefined) project.status = req.body.status;
  await project.save();
  const populated = await Project.findById(project._id)
    .populate('owner', 'name email avatarUrl role')
    .populate('members', 'name email avatarUrl role');
  res.json({ project: populated!.toJSON() });
}

export async function deleteProject(req: Request, res: Response) {
  const project = req.project!;
  // Cascade: comments → tasks → project
  const tasks = await Task.find({ project: project._id }).select('_id');
  const taskIds = tasks.map((t) => t._id);
  if (taskIds.length > 0) {
    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ _id: { $in: taskIds } });
  }
  await project.deleteOne();
  res.status(204).end();
}

export async function addMember(req: Request, res: Response) {
  const project = req.project!;
  const { userId } = req.body as { userId: string };
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const exists = project.members?.some((m) => m.toString() === userId);
  if (exists) throw ApiError.conflict('User is already a member');

  project.members = [...(project.members ?? []), user._id];
  await project.save();
  const populated = await Project.findById(project._id)
    .populate('owner', 'name email avatarUrl role')
    .populate('members', 'name email avatarUrl role');
  res.json({ project: populated!.toJSON() });
}

export async function removeMember(req: Request, res: Response) {
  const project = req.project!;
  const { userId } = req.params;

  if (project.owner.toString() === userId) {
    throw ApiError.badRequest('Cannot remove the project owner');
  }

  const before = project.members?.length ?? 0;
  project.members = (project.members ?? []).filter((m) => m.toString() !== userId);
  if ((project.members?.length ?? 0) === before) {
    throw ApiError.notFound('User is not a member of this project');
  }

  // Unassign tasks belonging to this user in this project
  await Task.updateMany(
    { project: project._id, assignee: userId },
    { $set: { assignee: null } },
  );

  await project.save();
  const populated = await Project.findById(project._id)
    .populate('owner', 'name email avatarUrl role')
    .populate('members', 'name email avatarUrl role');
  res.json({ project: populated!.toJSON() });
}
