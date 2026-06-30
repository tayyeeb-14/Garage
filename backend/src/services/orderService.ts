import { OrderRepository } from '../repositories/orderRepository.js';

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(input: Record<string, unknown>) {
    const orderId = this.generateOrderId();
    return this.orderRepository.create({ ...input, orderId });
  }

  async listOrders(query: Record<string, unknown>, page = 1, limit = 10) {
    return this.orderRepository.findAll(query, Number(page), Number(limit));
  }

  async getOrderById(id: string) {
    return this.orderRepository.findById(id);
  }

  async updateOrder(id: string, input: Record<string, unknown>) {
    return this.orderRepository.update(id, input);
  }

  async updateStatus(id: string, input: Record<string, unknown>) {
    return this.orderRepository.update(id, input);
  }

  async deleteOrder(id: string) {
    return this.orderRepository.softDelete(id);
  }

  async getOrdersForCustomer(customerId: string) {
    return this.orderRepository.findByCustomer(customerId);
  }

  private generateOrderId() {
    const prefix = 'OR';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
  }
}
