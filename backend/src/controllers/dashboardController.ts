import { NextFunction, Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { sendError, sendSuccess } from '../utils/response.js';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };

  getRecentOrders = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await this.dashboardService.getRecentOrders();
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  getLowStock = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.dashboardService.getLowStock();
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  getTopServices = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await this.dashboardService.getTopServices();
      sendSuccess(res, services);
    } catch (error) {
      next(error);
    }
  };
}
