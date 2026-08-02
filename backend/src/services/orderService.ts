import { OrderRepository } from '../repositories/orderRepository.js';
import { InventoryRepository } from '../repositories/inventoryRepository.js';

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async createOrder(input: Record<string, unknown>) {
    const payload = { ...input } as Record<string, unknown>;
    const orderId = this.generateOrderId();

    const parts = Array.isArray(payload.parts)
      ? payload.parts as Array<{ item: string; quantity: number; price?: number; name?: string; sku?: string }>
      : [];

    let computedTotal = 0;
    const preparedParts = [] as Array<Record<string, unknown>>;

    for (const part of parts) {
      const inventoryItem = await this.inventoryRepository.findById(part.item);
      if (!inventoryItem) {
        throw new Error('One or more selected parts are invalid');
      }
      if (inventoryItem.quantity < part.quantity) {
        throw new Error(`Insufficient stock for ${inventoryItem.itemName}`);
      }
      const quantity = Number(part.quantity);
      const price = inventoryItem.sellingPrice;
      computedTotal += price * quantity;
      preparedParts.push({
        item: inventoryItem._id,
        quantity,
        price,
        name: inventoryItem.itemName,
        sku: inventoryItem.sku,
      });
    }

    const requestTotal = Number(payload.totalAmount ?? 0);
    const totalAmount = requestTotal >= computedTotal ? requestTotal : computedTotal;

    if (preparedParts.length > 0) {
      for (const part of preparedParts) {
        await this.inventoryRepository.updateStock((part.item as unknown as string), -Number(part.quantity));
      }
    }

    return this.orderRepository.create({
      ...payload,
      orderId,
      parts: preparedParts,
      totalAmount,
    });
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
