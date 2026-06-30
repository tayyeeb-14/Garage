import { NextFunction, Request, Response } from 'express';
import { OrderService } from '../services/orderService.js';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await this.orderService.createOrder(req.body);
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

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
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

  getCustomerOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
      const orders = await this.orderService.getOrdersForCustomer(customerId);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  };
}
