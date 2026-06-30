import { BookingRepository } from '../repositories/bookingRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';

export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}
  constructor(private readonly bookingRepository: BookingRepository) {}

  async createBooking(input: Record<string, unknown>) {
    const bookingDate = new Date(input.bookingDate as string);
    const preferredTime = input.preferredTime as string;
    const vehicleId = input.vehicle as string;

    const now = new Date();
    const bookingDateOnly = new Date(bookingDate);
    bookingDateOnly.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    if (bookingDateOnly < today) {
      throw new Error('Booking date cannot be in the past');
    }

    const existing = await this.bookingRepository.findActiveByVehicleDateTime(vehicleId, bookingDate, preferredTime);
    if (existing) {
      throw new Error('A booking already exists for this vehicle on the selected date and time');
    }

    const bookingId = this.generateBookingId();
    return this.bookingRepository.create({ ...input, bookingId, bookingDate, preferredTime });
  }

  async listBookings(query: Record<string, unknown>, page = 1, limit = 10) {
    return this.bookingRepository.findAll(query, Number(page), Number(limit));
  }

  async getBookingById(id: string) {
    return this.bookingRepository.findById(id);
  }

  async updateBooking(id: string, input: Record<string, unknown>) {
    if (input.bookingDate || input.preferredTime || input.vehicle) {
      const existing = await this.bookingRepository.findById(id);
      const bookingDate = input.bookingDate ? new Date(input.bookingDate as string) : existing?.bookingDate;
      const preferredTime = (input.preferredTime as string) ?? existing?.preferredTime;
      const vehicleId = (input.vehicle as string) ?? existing?.vehicle?._id?.toString();
      const now = new Date();
      const bookingDateOnly = new Date(bookingDate as Date);
      bookingDateOnly.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      if (bookingDateOnly < today) {
        throw new Error('Booking date cannot be in the past');
      }
      if (vehicleId && preferredTime && bookingDate) {
        const duplicate = await this.bookingRepository.findActiveByVehicleDateTime(vehicleId, bookingDate, preferredTime);
        if (duplicate && duplicate._id.toString() !== id) {
          throw new Error('A booking already exists for this vehicle on the selected date and time');
        }
      }
    }

    const payload = { ...input } as Record<string, unknown>;
    if (payload.bookingDate) payload.bookingDate = new Date(payload.bookingDate as string);
    const updated = await this.bookingRepository.update(id, payload);
    if (updated && payload.status === 'confirmed') {
      await this.createOrderFromBooking(updated);
    }
    return updated;
  }

  async deleteBooking(id: string) {
    return this.bookingRepository.delete(id);
  }

  async getBookingsForCustomer(customerId: string) {
    return this.bookingRepository.findByCustomer(customerId);
  }

  async getStats() {
    return this.bookingRepository.getStats();
  }

  private async createOrderFromBooking(booking: any) {
    const orderRepository = new OrderRepository();
    const existing = await orderRepository.findById(booking._id.toString());
    if (existing) {
      return existing;
    }

    const services = Array.isArray(booking.services) ? booking.services.map((service: any) => service._id?.toString() ?? service.toString()) : [];
    const totalAmount = services.reduce((sum: number, service: any) => sum + Number(service?.price ?? 0), 0);

    return orderRepository.create({
      booking: booking._id,
      customer: booking.customer?._id ?? booking.customer,
      vehicle: booking.vehicle?._id ?? booking.vehicle,
      services,
      totalAmount,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: booking.notes,
    });
  }

  private generateBookingId() {
    const prefix = 'BK';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
  }
}
