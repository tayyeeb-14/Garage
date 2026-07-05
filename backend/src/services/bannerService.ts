import type { Express } from 'express';
import { BannerRepository } from '../repositories/bannerRepository.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUtils.js';
import type { IBanner } from '../models/Banner.js';

export class BannerService {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async createBanner(input: Record<string, unknown>) {
    const payload = { ...input } as Record<string, unknown>;
    const imageFile = payload.imageFile as Express.Multer.File | undefined;

    delete payload.imageFile;

    if (imageFile) {
      const upload = await uploadBufferToCloudinary(imageFile, 'menterprises/banners');
      payload.imageUrl = upload.secure_url;
    }

    return this.bannerRepository.create(payload as Partial<IBanner>);
  }

  async listBanners(query: Record<string, unknown> = {}) {
    return this.bannerRepository.findAll(query);
  }

  async getBannerById(id: string) {
    return this.bannerRepository.findById(id);
  }

  async updateBanner(id: string, input: Record<string, unknown>) {
    const existing = await this.bannerRepository.findById(id);
    if (!existing) return null;

    const payload = { ...input } as Record<string, unknown>;
    const imageFile = payload.imageFile as Express.Multer.File | undefined;

    delete payload.imageFile;

    if (imageFile) {
      const upload = await uploadBufferToCloudinary(imageFile, 'menterprises/banners');
      payload.imageUrl = upload.secure_url;
    }

    return this.bannerRepository.update(id, payload as Partial<IBanner>);
  }

  async deleteBanner(id: string) {
    return this.bannerRepository.delete(id);
  }
}
