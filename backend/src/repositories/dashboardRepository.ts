import { Booking } from '../models/Booking.js';
import { Customer } from '../models/Customer.js';
import Inventory from '../models/Inventory.js';
import { Order } from '../models/Order.js';
import { Service } from '../models/Service.js';
import { notDeletedFilter } from '../utils/inventoryFilters.js';

export class DashboardRepository {
  async getStats() {
    const [customers, services, products, bookings, orders] = await Promise.all([
      Customer.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Inventory.countDocuments({ ...notDeletedFilter(), isActive: true }),
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
    const items = await Inventory.find({
      ...notDeletedFilter(),
      $expr: { $lte: ['$quantity', '$minimumStock'] },
      quantity: { $gt: 0 },
    })
      .sort({ quantity: 1 })
      .limit(limit)
      .lean();

    return items.map((item) => ({
      _id: item._id,
      name: item.itemName,
      sku: item.sku,
      price: item.sellingPrice,
      stockQuantity: item.quantity,
      lowStockThreshold: item.minimumStock,
      image: item.image,
      brand: item.brand,
    }));
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
