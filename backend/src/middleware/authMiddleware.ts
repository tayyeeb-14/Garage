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
    if (req.originalUrl.startsWith('/api/bookings')) {
      console.log('protect() booking auth check:', {
        method: req.method,
        url: req.originalUrl,
        authorization: authHeader,
      });
    }
    if (!authHeader?.startsWith('Bearer ')) {
      if (req.originalUrl.startsWith('/api/bookings')) {
        console.log('protect() rejected booking request: missing bearer token');
      }
      return sendError(res, 'Authentication token is required', 401);
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (req.originalUrl.startsWith('/api/bookings')) {
        console.log('protect() decoded booking token:', payload);
      }
      if (payload.type !== 'access') {
        if (req.originalUrl.startsWith('/api/bookings')) {
          console.log('protect() rejected booking request: invalid token type');
        }
        return sendError(res, 'Invalid token type', 401);
      }
      if (roles.length && !roles.includes(payload.role)) {
        if (req.originalUrl.startsWith('/api/bookings')) {
          console.log('protect() rejected booking request: forbidden role');
        }
        return sendError(res, 'Forbidden', 403);
      }

      req.user = payload;
      return next();
    } catch (error) {
      if (req.originalUrl.startsWith('/api/bookings')) {
        console.log('protect() rejected booking request: token verification failed', error);
      }
      return sendError(res, 'Invalid or expired token', 401);
    }
  };
};

export const authenticateAdmin = protect(['admin']);
