import type { Request, Response, NextFunction } from 'express';

const TEST_REGEX = /^\$|\./;

function isPlainObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof Buffer);
}

function sanitizeObject(obj: any): void {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (isPlainObject(item) || Array.isArray(item)) {
        sanitizeObject(item);
      }
    }
  } else if (isPlainObject(obj)) {
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
        continue;
      }
      if (TEST_REGEX.test(key)) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
}

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  if (req.headers) sanitizeObject(req.headers);
  next();
};
