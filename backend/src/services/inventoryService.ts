import { InventoryRepository } from '../repositories/inventoryRepository.js';
import cloudinary from '../config/cloudinary.js';
import { v4 as uuidv4 } from 'uuid';

export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  private generateInventoryId() {
    return `INV-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
  }

  async createInventory(input: Record<string, unknown>) {
    const payload = { ...input } as Record<string, unknown>;
    payload.inventoryId = this.generateInventoryId();

    if (payload.image && typeof payload.image === 'string' && payload.image.startsWith('data:')) {
      const upload = await cloudinary.uploader.upload(payload.image, { folder: 'speedx/inventory' });
      payload.image = upload.secure_url;
    }

    return this.inventoryRepository.create(payload);
  }

  async listInventory(query: Record<string, unknown>) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    return this.inventoryRepository.findAll(query, page, limit);
  }

  async getInventoryById(id: string) {
    return this.inventoryRepository.findById(id);
  }

  async updateInventory(id: string, input: Record<string, unknown>) {
    const payload = { ...input } as Record<string, unknown>;

    if (payload.image && typeof payload.image === 'string' && payload.image.startsWith('data:')) {
      const upload = await cloudinary.uploader.upload(payload.image, { folder: 'speedx/inventory' });
      payload.image = upload.secure_url;
    }

    return this.inventoryRepository.update(id, payload);
  }

  async deleteInventory(id: string) {
    return this.inventoryRepository.softDelete(id);
  }

  async stockIn(id: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    return this.inventoryRepository.updateStock(id, quantity);
  }

  async stockOut(id: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new Error('Inventory item not found');
    }
    if (item.quantity < quantity) {
      throw new Error('Insufficient stock available');
    }
    return this.inventoryRepository.updateStock(id, -quantity);
  }

  async getLowStockItems(limit = 10) {
    return this.inventoryRepository.getLowStockItems(limit);
  }

  async getOutOfStockItems(limit = 10) {
    return this.inventoryRepository.getOutOfStockItems(limit);
  }

  async getDashboardStats() {
    return this.inventoryRepository.getDashboardStats();
  }
}
