import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/ApiError.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formatted = result.error.issues.map((e) => ({
        field: e.path.map(String).join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Request validation failed', formatted));
    }
    req.body = result.data;
    next();
  };
};
