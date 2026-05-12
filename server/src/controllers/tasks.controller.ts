import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task, type TaskStatus } from '../models/Task';
import { Project } from '../models/Project';
import { Comment } from '../models/Comment';
import { ApiError } from '../utils/ApiError';

function canEditTaskFully(
  user: { sub: string; role: 'admin' | 'manager' | 'member' },
  task: { createdBy: { toString(): string } },
  project: { owner: { toString(): string } },
) {
  if (user.role === 'admin') return true;
  if (project.owner.toString() === user.sub) return true;
  if (task.createdBy.toString() === user.sub) return true;
  return false;
}

function isProjectMember(
  userId: string,
  project: { owner: { toString(): string }; members?: { toString(): string }[] },
) {
  return (
    project.owner.toString() === userId ||
    (project.members?.some((m) => m.toString() === userId) ?? false)
  );
}

export async function listTasks(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const q = req.query as Record<string, unknown>;
  const pageN = Number(q.page ?? 1);
  const limitN = Number(q.limit ?? 20);

  // Scope: which projects can the user see?
  const userId = new mongoose.Types.ObjectId(req.user.sub);
  let allowedProjects: mongoose.Types.ObjectId[] | null = null;
  if (req.user.role !== 'admin') {
    const projects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select('_id');
    allowedProjects = projects.map((p) => p._id);
  }

  const filter: Record<string, unknown> = {};
  if (allowedProjects) filter.project = { $in: allowedProjects };
  if (q.project) {
    const pId = String(q.project);
    if (!mongoose.Types.ObjectId.isValid(pId)) throw ApiError.badRequest('Invalid project id');
    if (allowedProjects && !allowedProjects.some((p) => p.toString() === pId)) {
      throw ApiError.forbidden('You do not have access to that project');
    }
    filter.project = new mongoose.Types.ObjectId(pId);
  }
  if (q.assignee) filter.assignee = new mongoose.Types.ObjectId(String(q.assignee));
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.mine === true) filter.assignee = userId;
  if (q.overdue === true) {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $ne: 'done' };
  }
  if (q.q) filter.title = { $regex: String(q.q), $options: 'i' };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    createdAt: { createdAt: 1 },
    '-createdAt': { createdAt: -1 },
    dueDate: { dueDate: 1 },
    '-dueDate': { dueDate: -1 },
    priority: { priority: -1, dueDate: 1 },
  };
  const sort = sortMap[String(q.sort ?? '-createdAt')] ?? { createdAt: -1 };

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatarUrl role')
      .populate('createdBy', 'name email avatarUrl role')
      .populate('project', 'name')
      .sort(sort)
      .skip((pageN - 1) * limitN)
      .limit(limitN),
    Task.countDocuments(filter),
  ]);

  res.json({
    items: items.map((t) => t.toJSON()),
    page: pageN,
    limit: limitN,
    total,
    pages: Math.ceil(total / limitN),
  });
}

async function loadTaskWithAccess(taskId: string, user: { sub: string; role: 'admin' | 'manager' | 'member' }) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) throw ApiError.badRequest('Invalid task id');
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  const project = await Project.findById(task.project);
  if (!project) throw ApiError.notFound('Project not found');
  if (user.role !== 'admin' && !isProjectMember(user.sub, project)) {
    throw ApiError.forbidden('You do not have access to that task');
  }
  return { task, project };
}

export async function getTask(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { task } = await loadTaskWithAccess(req.params.id, req.user);
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email avatarUrl role')
    .populate('createdBy', 'name email avatarUrl role')
    .populate('project', 'name');
  res.json({ task: populated!.toJSON() });
}

export async function createTask(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const body = req.body as {
    title: string;
    description?: string;
    project: string;
    assignee?: string | null;
    status?: TaskStatus;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date | null;
  };

  if (req.user.role === 'member') {
    throw ApiError.forbidden('Members cannot create tasks');
  }

  const project = await Project.findById(body.project);
  if (!project) throw ApiError.notFound('Project not found');
  if (project.status === 'archived') {
    throw ApiError.badRequest('Cannot add tasks to an archived project');
  }

  if (req.user.role !== 'admin' && !isProjectMember(req.user.sub, project)) {
    throw ApiError.forbidden('You are not a member of this project');
  }

  if (body.assignee) {
    if (!isProjectMember(body.assignee, project)) {
      throw ApiError.badRequest('Assignee must be a member of the project');
    }
  }

  const task = await Task.create({
    title: body.title,
    description: body.description ?? '',
    project: project._id,
    assignee: body.assignee ?? null,
    createdBy: req.user.sub,
    status: body.status ?? 'todo',
    priority: body.priority ?? 'medium',
    dueDate: body.dueDate ?? null,
    completedAt: body.status === 'done' ? new Date() : null,
  });

  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email avatarUrl role')
    .populate('createdBy', 'name email avatarUrl role')
    .populate('project', 'name');
  res.status(201).json({ task: populated!.toJSON() });
}

export async function updateTask(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { task, project } = await loadTaskWithAccess(req.params.id, req.user);

  const fullEdit = canEditTaskFully(req.user, task, project);
  const isAssignee = task.assignee?.toString() === req.user.sub;
  const body = req.body as Record<string, unknown>;

  // Members who are only assignees can change status/description; everything else needs fullEdit
  const restrictedFields = ['title', 'priority', 'dueDate', 'assignee'];
  if (!fullEdit) {
    if (!isAssignee) throw ApiError.forbidden('Only the assignee or a project lead can edit this task');
    for (const f of restrictedFields) {
      if (f in body) throw ApiError.forbidden(`You can only update status and description`);
    }
  }

  if (body.assignee !== undefined) {
    if (body.assignee && !isProjectMember(String(body.assignee), project)) {
      throw ApiError.badRequest('Assignee must be a member of the project');
    }
    task.assignee = body.assignee as mongoose.Types.ObjectId | null;
  }

  if (typeof body.title === 'string') task.title = body.title;
  if (typeof body.description === 'string') task.description = body.description;
  if (typeof body.priority === 'string') task.priority = body.priority as typeof task.priority;
  if (body.dueDate !== undefined) task.dueDate = body.dueDate ? new Date(body.dueDate as string) : null;

  if (typeof body.status === 'string' && body.status !== task.status) {
    const next = body.status as TaskStatus;
    task.status = next;
    task.completedAt = next === 'done' ? new Date() : null;
  }

  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email avatarUrl role')
    .populate('createdBy', 'name email avatarUrl role')
    .populate('project', 'name');
  res.json({ task: populated!.toJSON() });
}

export async function updateTaskStatus(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { task, project } = await loadTaskWithAccess(req.params.id, req.user);
  const { status } = req.body as { status: TaskStatus };

  const isAssignee = task.assignee?.toString() === req.user.sub;
  const fullEdit = canEditTaskFully(req.user, task, project);
  if (!isAssignee && !fullEdit) {
    throw ApiError.forbidden('Only the assignee or a project lead can change status');
  }

  if (status !== task.status) {
    task.status = status;
    task.completedAt = status === 'done' ? new Date() : null;
    await task.save();
  }

  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email avatarUrl role')
    .populate('createdBy', 'name email avatarUrl role')
    .populate('project', 'name');
  res.json({ task: populated!.toJSON() });
}

export async function deleteTask(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const { task, project } = await loadTaskWithAccess(req.params.id, req.user);
  if (!canEditTaskFully(req.user, task, project)) {
    throw ApiError.forbidden('Only the creator, project owner, or admin can delete a task');
  }
  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();
  res.status(204).end();
}
