import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.flatten().fieldErrors[Object.keys(parsed.error.flatten().fieldErrors)[0]]?.[0] ?? 'Validation failed', 400);
    }

    req.body = parsed.data;
    return next();
  };
};

export const validateRequest = (schema: ZodSchema, location: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = location === 'body' ? req.body : location === 'query' ? req.query : req.params;
    const parsed = schema.safeParse(target);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors[Object.keys(parsed.error.flatten().fieldErrors)[0]]?.[0] ?? 'Validation failed';
      return sendError(res, firstError, 400);
    }

    if (location === 'body') {
      req.body = parsed.data;
    } else if (location === 'query') {
      req.query = parsed.data as typeof req.query;
    } else {
      req.params = parsed.data as typeof req.params;
    }

    return next();
  };
};
