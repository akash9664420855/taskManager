import type { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import type { LoginInput, SignupInput } from '../schemas/auth.schema';

const REFRESH_COOKIE = 'tm_refresh';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function issueTokens(user: { _id: { toString(): string }; role: 'admin' | 'manager' | 'member'; tokenVersion?: number }) {
  const userId = user._id.toString();
  const accessToken = signAccessToken({ sub: userId, role: user.role });
  const refreshToken = signRefreshToken({ sub: userId, tv: user.tokenVersion ?? 0 });
  return { accessToken, refreshToken };
}

export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body as SignupInput;

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, password, role: 'member' });
  const { accessToken, refreshToken } = issueTokens(user);

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
  res.status(201).json({
    user: user.toJSON(),
    accessToken,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
  res.json({ user: user.toJSON(), accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if ((user.tokenVersion ?? 0) !== payload.tv) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
  res.json({ user: user.toJSON(), accessToken });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { ...REFRESH_COOKIE_OPTS, maxAge: 0 });
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.sub);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user: user.toJSON() });
}
