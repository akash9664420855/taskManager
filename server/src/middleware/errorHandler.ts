import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string[]> = {};
    for (const [field, e] of Object.entries(err.errors)) {
      details[field] = [e.message];
    }
    res.status(400).json({
      error: { message: 'Validation failed', code: 'VALIDATION', details },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: { message: `Invalid ${err.path}`, code: 'BAD_REQUEST' },
    });
    return;
  }

  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? 'field';
    res.status(409).json({
      error: {
        message: `${field} already exists`,
        code: 'CONFLICT',
        details: { [field]: ['already exists'] },
      },
    });
    return;
  }

  // Unknown error
  if (env.NODE_ENV !== 'test') {
    console.error('[error]', err);
  }
  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : String(err),
      code: 'INTERNAL',
    },
  });
};
