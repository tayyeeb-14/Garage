import { FilterQuery, Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking.js';

export class BookingRepository {
  async create(data: Partial<IBooking>) {
    return Booking.create(data);
  }

  async findById(id: string) {
    return Booking.findById(id)
      .populate('customer', 'fullName email phone address')
      .populate('vehicle', 'plateNumber make modelName year color')
      .populate('services', 'name price description')
      .lean();
  }

  async findAll(query: Record<string, unknown>, page = 1, limit = 10) {
    const filter: FilterQuery<IBooking> = {};

    if (query.search) {
      const search = query.search as string;
      filter.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status as IBooking['status'];
    }

    if (query.date) {
      const day = new Date(query.date as string);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.bookingDate = { $gte: day, $lt: nextDay };
    }

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate('customer', 'fullName email phone address')
        .populate('vehicle', 'plateNumber make modelName year color')
        .populate('services', 'name price description')
        .sort({ bookingDate: 1, preferredTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Partial<IBooking>) {
    return Booking.findByIdAndUpdate(id, data, { new: true })
      .populate('customer', 'fullName email phone address')
      .populate('vehicle', 'plateNumber make modelName year color')
      .populate('services', 'name price description')
      .lean();
  }

  async delete(id: string) {
    return Booking.findByIdAndDelete(id).lean();
  }

  async findActiveByVehicleDateTime(vehicleId: string, bookingDate: Date, preferredTime: string) {
    return Booking.findOne({
      vehicle: new Types.ObjectId(vehicleId),
      bookingDate,
      preferredTime,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
    }).lean();
  }

  async findByCustomer(customerId: string) {
    return Booking.find({ customer: new Types.ObjectId(customerId) })
      .populate('vehicle', 'plateNumber make modelName year color')
      .populate('services', 'name price description')
      .sort({ bookingDate: -1, preferredTime: -1 })
      .lean();
  }

  async getStats() {
    const [pending, confirmed, inProgress, completed, cancelled] = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'in_progress' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ]);

    return { pending, confirmed, inProgress, completed, cancelled };
  }
}
