import type { Express } from 'express';
import { ServiceRepository } from '../repositories/serviceRepository.js';
import { deleteCloudinaryAsset, uploadBufferToCloudinary } from '../utils/cloudinaryUtils.js';
import type { IService } from '../models/Service.js';

export class ServiceService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async createService(input: Record<string, unknown>) {
    const payload = { ...input } as Record<string, unknown>;
    const thumbnailFile = payload.thumbnailImageFile as Express.Multer.File | undefined;
    const galleryFiles = Array.isArray(payload.galleryImageFiles)
      ? (payload.galleryImageFiles as Express.Multer.File[])
      : [];

    delete payload.thumbnailImageFile;
    delete payload.galleryImageFiles;

    if (thumbnailFile) {
      const upload = await uploadBufferToCloudinary(thumbnailFile, 'menterprises/services');
      payload.thumbnailImage = upload.secure_url;
    }

    if (galleryFiles.length) {
      payload.galleryImages = await Promise.all(
        galleryFiles.map(async (file) => {
          const upload = await uploadBufferToCloudinary(file, 'menterprises/services/gallery');
          return upload.secure_url;
        })
      );
    }

    return this.serviceRepository.create(payload as Partial<IService>);
  }

  async listServices(query: Record<string, unknown>) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    return this.serviceRepository.findAll(query, page, limit);
  }

  async getServiceById(id: string) {
    return this.serviceRepository.findById(id);
  }

  async updateService(id: string, input: Record<string, unknown>) {
    const existing = await this.serviceRepository.findById(id);
    if (!existing) return null;

    const payload = { ...input } as Record<string, unknown>;
    const thumbnailFile = payload.thumbnailImageFile as Express.Multer.File | undefined;
    const galleryFiles = Array.isArray(payload.galleryImageFiles)
      ? (payload.galleryImageFiles as Express.Multer.File[])
      : [];

    delete payload.thumbnailImageFile;
    delete payload.galleryImageFiles;

    if (thumbnailFile) {
      if (existing.thumbnailImage) {
        await deleteCloudinaryAsset(existing.thumbnailImage);
      }
      const upload = await uploadBufferToCloudinary(thumbnailFile, 'menterprises/services');
      payload.thumbnailImage = upload.secure_url;
    }

    if (galleryFiles.length) {
      if (Array.isArray(existing.galleryImages) && existing.galleryImages.length > 0) {
        await Promise.all(existing.galleryImages.map(async (url) => deleteCloudinaryAsset(url)));
      }
      payload.galleryImages = await Promise.all(
        galleryFiles.map(async (file) => {
          const upload = await uploadBufferToCloudinary(file, 'menterprises/services/gallery');
          return upload.secure_url;
        })
      );
    }

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

    return this.serviceRepository.delete(id);
  }

  async listPublicServices(query: Record<string, unknown> = {}) {
    return this.serviceRepository.listPublic(query);
  }
}
