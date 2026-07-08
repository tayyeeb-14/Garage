import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const authErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return sendError(res, err.issues[0]?.message ?? 'Validation failed', 400);
  }

  if (err instanceof Error) {
    if (err.message === 'Invalid credentials') {
      return sendError(res, 'Invalid credentials', 401);
    }
    if (err.message === 'Email already registered') {
      return sendError(res, 'Email already registered', 409);
    }
    if (err.message === 'SKU already exists') {
      return sendError(res, 'SKU already exists', 409);
    }
    if (err.message === 'Service name already exists') {
      return sendError(res, 'Service name already exists', 409);
    }
    if (err.message === 'Invalid token type' || err.message === 'Invalid or expired token') {
      return sendError(res, err.message, 401);
    }
    return sendError(res, err.message, 400);
  }

  return sendError(res, 'Unexpected authentication error', 500);
};
