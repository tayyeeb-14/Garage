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
