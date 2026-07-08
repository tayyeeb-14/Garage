import type { Express } from 'express';
import { InventoryRepository } from '../repositories/inventoryRepository.js';
import { deleteCloudinaryAsset, uploadBufferToCloudinary } from '../utils/cloudinaryUtils.js';
import type { IInventory } from '../models/Inventory.js';
import { v4 as uuidv4 } from 'uuid';

export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  private generateInventoryId() {
    return `INV-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
  }

  private parsePagination(query: Record<string, unknown>, defaultLimit = 10) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));
    return { page, limit };
  }

  private async applyImageUploads(payload: Record<string, unknown>, existing?: IInventory | null) {
    const thumbnailFile = payload.thumbnailImageFile as Express.Multer.File | undefined;
    const galleryFiles = Array.isArray(payload.galleryImageFiles)
      ? (payload.galleryImageFiles as Express.Multer.File[])
      : [];
    const removeThumbnail = payload.removeThumbnail === true || payload.removeThumbnail === 'true';

    delete payload.thumbnailImageFile;
    delete payload.galleryImageFiles;
    delete payload.removeThumbnail;
    delete payload.image;

    if (removeThumbnail && existing?.image) {
      await deleteCloudinaryAsset(existing.image);
      payload.image = '';
    }

    if (thumbnailFile) {
      if (existing?.image) {
        await deleteCloudinaryAsset(existing.image);
      }
      const upload = await uploadBufferToCloudinary(thumbnailFile, 'menterprises/inventory');
      payload.image = upload.secure_url;
    }

    if (galleryFiles.length) {
      if (existing?.galleryImages?.length) {
        await Promise.all(existing.galleryImages.map(async (url) => deleteCloudinaryAsset(url)));
      }
      payload.galleryImages = await Promise.all(
        galleryFiles.map(async (file) => {
          const upload = await uploadBufferToCloudinary(file, 'menterprises/inventory/gallery');
          return upload.secure_url;
        }),
      );
    }

    return payload;
  }

  private async assertUniqueSku(sku: string, excludeId?: string) {
    const existing = await this.inventoryRepository.findBySku(sku);
    if (existing && existing._id.toString() !== excludeId) {
      throw new Error('SKU already exists');
    }
  }

  async createInventory(input: Record<string, unknown>) {
    const payload = await this.applyImageUploads({ ...input });
    if (payload.sku) {
      await this.assertUniqueSku(String(payload.sku));
    }
    payload.inventoryId = this.generateInventoryId();
    return this.inventoryRepository.create(payload as Partial<IInventory>);
  }

  async listInventory(query: Record<string, unknown>) {
    const { page, limit } = this.parsePagination(query);
    return this.inventoryRepository.findAll(query, page, limit);
  }

  async listPublicParts(query: Record<string, unknown>) {
    const { page, limit } = this.parsePagination(query, 20);
    return this.inventoryRepository.findPublic(query, page, limit);
  }

  async getInventoryById(id: string) {
    return this.inventoryRepository.findById(id);
  }

  async updateInventory(id: string, input: Record<string, unknown>) {
    const existing = await this.inventoryRepository.findById(id);
    if (!existing) return null;

    if (input.sku && String(input.sku).trim() !== existing.sku) {
      await this.assertUniqueSku(String(input.sku), id);
    }

    const payload = await this.applyImageUploads({ ...input }, existing as unknown as IInventory);
    return this.inventoryRepository.update(id, payload as Partial<IInventory>);
  }

  async deleteInventory(id: string) {
    const existing = await this.inventoryRepository.findById(id);
    if (!existing) return null;

    if (existing.image) {
      await deleteCloudinaryAsset(existing.image);
    }

    if (Array.isArray(existing.galleryImages) && existing.galleryImages.length > 0) {
      await Promise.all(existing.galleryImages.map(async (url) => deleteCloudinaryAsset(url)));
    }

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
    return this.inventoryRepository.updateStock(id, -quantity);
  }

  async setStockStatus(id: string, status: 'In Stock' | 'Out Of Stock') {
    return this.inventoryRepository.setStockStatus(id, status);
  }

  async getLowStockItems(limit = 10) {
    return this.inventoryRepository.getLowStockItems(Math.min(100, Math.max(1, limit)));
  }

  async getOutOfStockItems(limit = 10) {
    return this.inventoryRepository.getOutOfStockItems(Math.min(100, Math.max(1, limit)));
  }

  async getCategories() {
    return this.inventoryRepository.getCategories();
  }

  async getBrands() {
    return this.inventoryRepository.getBrands();
  }

  async getDashboardStats() {
    return this.inventoryRepository.getDashboardStats();
  }
}
