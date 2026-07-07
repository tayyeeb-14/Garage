import { NextFunction, Request, Response } from 'express';
import { BookingService } from '../services/bookingService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const payload = { ...req.body } as Record<string, unknown>;
      if (authReq.user?.role === 'customer') {
        payload.customer = authReq.user.sub;
      }
      const booking = await this.bookingService.createBooking(payload);
      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  };

  getBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const bookings = await this.bookingService.listBookings(req.query as Record<string, unknown>, page, limit);
      res.json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  };

  getBookingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const booking = await this.bookingService.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  updateBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const booking = await this.bookingService.updateBooking(id, req.body);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const booking = await this.bookingService.deleteBooking(id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      res.json({ success: true, data: booking, message: 'Booking deleted successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  getCustomerBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
      if (authReq.user?.role === 'customer' && authReq.user.sub !== customerId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const bookings = await this.bookingService.getBookingsForCustomer(customerId);
      res.json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.bookingService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
