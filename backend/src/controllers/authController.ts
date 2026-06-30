import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AuthService } from '../services/authService.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { adminLoginSchema, customerLoginSchema, customerRegisterSchema, profileUpdateSchema } from '../validators/authValidators.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  adminLogin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = adminLoginSchema.parse(req.body);
      const result = await this.authService.adminLogin(parsed.email, parsed.password);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  customerRegister = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = customerRegisterSchema.parse(req.body);
      const result = await this.authService.customerRegister(parsed);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  customerLogin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = customerLoginSchema.parse(req.body);
      const result = await this.authService.customerLogin(parsed.email, parsed.password);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required', 400);
      }

      const result = await this.authService.refreshToken(refreshToken);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const profile = await this.authService.getProfile(user?.sub ?? '', user?.role ?? '');
      sendSuccess(res, profile, 200);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = profileUpdateSchema.parse(req.body);
      const user = req.user;
      const result = await this.authService.updateProfile(user?.sub ?? '', user?.role ?? '', parsed);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
