import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { OrderService } from '../services/orderService.js';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body } as Record<string, unknown>;
      if (req.user?.role === 'customer' && req.user.sub) {
        payload.customer = req.user.sub;
      }
      const order = await this.orderService.createOrder(payload);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const orders = await this.orderService.listOrders(req.query as Record<string, unknown>, page, limit);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (req.user?.role === 'customer') {
        const customerId = typeof order.customer === 'string'
          ? order.customer
          : order.customer?._id?.toString() ?? '';
        if (customerId !== req.user.sub) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.updateOrder(id, req.body);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.deleteOrder(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, data: order, message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.updateStatus(id, req.body);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  getCustomerOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
      if (req.user?.role === 'customer') {
        if (customerId !== 'me' && customerId !== req.user.sub) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        customerId = req.user.sub;
      }
      const orders = await this.orderService.getOrdersForCustomer(customerId);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  };
}
