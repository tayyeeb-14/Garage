import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/auth.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
    type: 'access' | 'refresh';
  };
}

export const protect = (roles: string[] = []) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token is required', 401);
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload.type !== 'access') {
        return sendError(res, 'Invalid token type', 401);
      }
      if (roles.length && !roles.includes(payload.role)) {
        return sendError(res, 'Forbidden', 403);
      }

      req.user = payload;
      return next();
    } catch (error) {
      return sendError(res, 'Invalid or expired token', 401);
    }
  };
};
