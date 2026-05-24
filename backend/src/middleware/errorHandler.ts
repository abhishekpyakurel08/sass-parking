import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Centralized Global Error Handler
 * Must be registered LAST in Express middleware chain.
 *
 * Standard error response format:
 * { success: false, message: string, errors: [], stack?: string }
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log all errors with context
  logger.error(`[${req.method}] ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
  });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(env.isProd ? {} : { stack: err.stack }),
    });
    return;
  }

  // Handle Mongoose cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      errors: [],
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Database validation failed',
      errors: [err.message],
    });
    return;
  }

  // MongoDB duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] ?? 'field';
    res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
      errors: [],
    });
    return;
  }

  // Fallback: 500 Internal Server Error
  res.status(500).json({
    success: false,
    message: env.isProd ? 'An unexpected error occurred' : err.message,
    errors: [],
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};

/**
 * 404 Not Found — catch-all for unmatched routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(
    new ApiError(
      404,
      `Route not found: [${req.method}] ${req.originalUrl}`
    )
  );
};
