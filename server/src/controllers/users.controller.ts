import type { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export async function listUsers(req: Request, res: Response) {
  const { page = 1, limit = 20, q, role } = req.query as Record<string, string | undefined>;
  const pageN = Number(page);
  const limitN = Number(limit);

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageN - 1) * limitN)
      .limit(limitN),
    User.countDocuments(filter),
  ]);

  res.json({
    items: items.map((u) => u.toJSON()),
    page: pageN,
    limit: limitN,
    total,
    pages: Math.ceil(total / limitN),
  });
}

export async function getUser(req: Request, res: Response) {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user: user.toJSON() });
}

export async function updateUser(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();

  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('User not found');

  // Don't allow demoting the last admin
  if (req.body.role && target.role === 'admin' && req.body.role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw ApiError.badRequest('Cannot demote the last admin');
  }

  if (req.body.name !== undefined) target.name = req.body.name;
  if (req.body.role !== undefined) {
    target.role = req.body.role;
    target.tokenVersion = (target.tokenVersion ?? 0) + 1; // invalidate refresh tokens
  }
  await target.save();
  res.json({ user: target.toJSON() });
}

export async function deleteUser(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.sub === req.params.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('User not found');
  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw ApiError.badRequest('Cannot delete the last admin');
  }
  await target.deleteOne();
  res.status(204).end();
}
