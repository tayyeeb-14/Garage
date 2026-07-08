import type { Express } from 'express';
import { ServiceRepository } from '../repositories/serviceRepository.js';
import { deleteCloudinaryAsset, uploadBufferToCloudinary } from '../utils/cloudinaryUtils.js';
import type { IService } from '../models/Service.js';

export class ServiceService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  private parsePagination(query: Record<string, unknown>, defaultLimit = 10) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));
    return { page, limit };
  }

  private async applyImageUploads(payload: Record<string, unknown>, existing?: IService | null) {
    const thumbnailFile = payload.thumbnailImageFile as Express.Multer.File | undefined;
    const galleryFiles = Array.isArray(payload.galleryImageFiles)
      ? (payload.galleryImageFiles as Express.Multer.File[])
      : [];
    const removeThumbnail = payload.removeThumbnail === true || payload.removeThumbnail === 'true';

    delete payload.thumbnailImageFile;
    delete payload.galleryImageFiles;
    delete payload.removeThumbnail;
    delete payload.thumbnailImage;
    delete payload.galleryImages;

    if (removeThumbnail && existing?.thumbnailImage) {
      await deleteCloudinaryAsset(existing.thumbnailImage);
      payload.thumbnailImage = '';
    }

    if (thumbnailFile) {
      if (existing?.thumbnailImage) {
        await deleteCloudinaryAsset(existing.thumbnailImage);
      }
      const upload = await uploadBufferToCloudinary(thumbnailFile, 'menterprises/services');
      payload.thumbnailImage = upload.secure_url;
    }

    if (galleryFiles.length) {
      if (existing?.galleryImages?.length) {
        await Promise.all(existing.galleryImages.map(async (url) => deleteCloudinaryAsset(url)));
      }
      payload.galleryImages = await Promise.all(
        galleryFiles.map(async (file) => {
          const upload = await uploadBufferToCloudinary(file, 'menterprises/services/gallery');
          return upload.secure_url;
        }),
      );
    }

    return payload;
  }

  private normalizePayload(payload: Record<string, unknown>) {
    if (payload.relatedServices) {
      payload.relatedServices = this.serviceRepository.normalizeRelatedServices(
        payload.relatedServices as string[],
      );
    }
    return payload;
  }

  private async assertUniqueName(name: string, excludeId?: string) {
    const existing = await this.serviceRepository.findByName(name);
    if (existing && existing._id.toString() !== excludeId) {
      throw new Error('Service name already exists');
    }
  }

  async createService(input: Record<string, unknown>) {
    const payload = this.normalizePayload(await this.applyImageUploads({ ...input }));
    if (payload.name) {
      await this.assertUniqueName(String(payload.name));
    }
    return this.serviceRepository.create(payload as Partial<IService>);
  }

  async listServices(query: Record<string, unknown>) {
    const { page, limit } = this.parsePagination(query);
    return this.serviceRepository.findAll(query, page, limit);
  }

  async getServiceById(id: string) {
    return this.serviceRepository.findById(id);
  }

  async updateService(id: string, input: Record<string, unknown>) {
    const existing = await this.serviceRepository.findById(id);
    if (!existing) return null;

    if (input.name && String(input.name).trim() !== existing.name) {
      await this.assertUniqueName(String(input.name), id);
    }

    const payload = this.normalizePayload(
      await this.applyImageUploads({ ...input }, existing as unknown as IService),
    );
    return this.serviceRepository.update(id, payload as Partial<IService>);
  }

  async deleteService(id: string) {
    const existing = await this.serviceRepository.findById(id);
    if (!existing) return null;

    if (existing.thumbnailImage) {
      await deleteCloudinaryAsset(existing.thumbnailImage);
    }

    if (Array.isArray(existing.galleryImages) && existing.galleryImages.length > 0) {
      await Promise.all(existing.galleryImages.map(async (url) => deleteCloudinaryAsset(url)));
    }

    return this.serviceRepository.softDelete(id);
  }

  async listPublicServices(query: Record<string, unknown> = {}) {
    const { page, limit } = this.parsePagination(query, 20);
    return this.serviceRepository.findPublic(query, page, limit);
  }

  async getPublicServiceById(id: string) {
    return this.serviceRepository.findPublicById(id);
  }

  async getCategories() {
    return this.serviceRepository.getCategories();
  }

  async getDashboardStats() {
    return this.serviceRepository.getDashboardStats();
  }
}
