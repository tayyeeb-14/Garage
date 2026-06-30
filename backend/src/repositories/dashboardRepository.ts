import { Booking } from '../models/Booking.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';

export class DashboardRepository {
  async getStats() {
    const [customers, services, products, bookings, orders] = await Promise.all([
      Customer.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Order.countDocuments(),
    ]);

    const revenueResult = await Order.aggregate([
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]);

    const revenue = revenueResult[0]?.revenue ?? 0;

    return { customers, services, products, bookings, orders, revenue };
  }

  async getRecentOrders(limit = 8) {
    return Order.find()
      .populate('customer', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getLowStock(limit = 5) {
    return Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    })
      .sort({ stockQuantity: 1 })
      .limit(limit)
      .lean();
  }

  async getTopServices(limit = 5) {
    const services = await Booking.aggregate([
      { $unwind: '$services' },
      { $group: { _id: '$services', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: limit },
    ]);

    const serviceIds = services.map((item) => item._id);
    const populated = await Service.find({ _id: { $in: serviceIds } }).lean();

    return populated.map((service) => {
      const match = services.find((item) => item._id.toString() === service._id.toString());
      return { ...service, bookings: match?.bookings ?? 0 };
    });
  }
}
