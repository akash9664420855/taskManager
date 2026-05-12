import type { RequestHandler } from 'express';
import { z, type ZodSchema } from 'zod';

export type ValidationSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Reassign individually since req.query is a getter on some Express setups
        for (const k of Object.keys(req.query)) delete (req.query as Record<string, unknown>)[k];
        Object.assign(req.query, parsed);
      }
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const objectIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');
