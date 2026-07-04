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
    if (location === 'body') {
      console.log('Request headers:', {
        method: req.method,
        url: req.originalUrl,
        contentType: req.headers['content-type'],
        accept: req.headers.accept,
        authorization: req.headers.authorization,
      });
      console.log('Request body before validation:', {
        type: typeof req.body,
        isArray: Array.isArray(req.body),
        value: req.body,
      });
    }

    let target = location === 'body' ? req.body : location === 'query' ? req.query : req.params;

    if (location === 'body' && typeof target === 'string') {
      try {
        target = JSON.parse(target);
        console.log('Parsed raw string request body into JSON:', target);
      } catch (error) {
        console.error('Failed to parse raw string request body:', error);
      }
    }

    const parsed = schema.safeParse(target);

    if (!parsed.success) {
      console.error('Validation errors:', parsed.error.issues);
      const firstError = parsed.error.issues[0]?.message ?? 'Validation failed';
      return sendError(res, firstError, 400);
    }

    if (location === 'body') {
      req.body = parsed.data;
      console.log('Request body after validation:', req.body);
    } else if (location === 'query') {
      req.query = parsed.data as typeof req.query;
    } else {
      req.params = parsed.data as typeof req.params;
    }

    return next();
  };
};
