import { FilterQuery, Types } from 'mongoose';
import { Order, IOrder } from '../models/Order.js';

export class OrderRepository {
  async create(data: Partial<IOrder>) {
    return Order.create(data);
  }

  async findById(id: string) {
    return Order.findById(id)
      .populate('booking', 'bookingId bookingDate preferredTime address status')
      .populate('customer', 'fullName email phone address')
      .populate('vehicle', 'plateNumber make modelName year color')
      .populate('services', 'name price description')
      .lean();
  }

  async findAll(query: Record<string, unknown>, page = 1, limit = 10) {
    const filter: FilterQuery<IOrder> = { deletedAt: { $exists: false } };

    if (query.search) {
      const search = query.search as string;
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.orderStatus = query.status as IOrder['orderStatus'];
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus as IOrder['paymentStatus'];
    }

    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod as IOrder['paymentMethod'];
    }

    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'total-asc') sort.totalAmount = 1;
    if (query.sort === 'total-desc') sort.totalAmount = -1;
    if (query.sort === 'date-asc') sort.createdAt = 1;
    if (query.sort === 'date-desc') sort.createdAt = -1;

    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('booking', 'bookingId bookingDate preferredTime address status')
        .populate('customer', 'fullName email phone address')
        .populate('vehicle', 'plateNumber make modelName year color')
        .populate('services', 'name price description')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Partial<IOrder>) {
    return Order.findByIdAndUpdate(id, data, { new: true })
      .populate('booking', 'bookingId bookingDate preferredTime address status')
      .populate('customer', 'fullName email phone address')
      .populate('vehicle', 'plateNumber make modelName year color')
      .populate('services', 'name price description')
      .lean();
  }

  async softDelete(id: string) {
    return Order.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true }).lean();
  }

  async findByCustomer(customerId: string) {
    return Order.find({ customer: new Types.ObjectId(customerId), deletedAt: { $exists: false } })
      .populate('booking', 'bookingId bookingDate preferredTime address status')
      .populate('vehicle', 'plateNumber make modelName year color')
      .populate('services', 'name price description')
      .sort({ createdAt: -1 })
      .lean();
  }
}
