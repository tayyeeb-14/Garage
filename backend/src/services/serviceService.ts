import { ServiceRepository } from '../repositories/serviceRepository.js';
import cloudinary from '../config/cloudinary.js';

export class ServiceService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async createService(input: Record<string, unknown>) {
    const payload = { ...input } as Record<string, unknown>;
    if (payload.thumbnailImage && typeof payload.thumbnailImage === 'string') {
      const upload = await cloudinary.uploader.upload(payload.thumbnailImage, { folder: 'menterprises/services' });
      payload.thumbnailImage = upload.secure_url;
    }

    if (Array.isArray(payload.galleryImages)) {
      payload.galleryImages = await Promise.all(
        payload.galleryImages.map(async (image) => {
          if (typeof image !== 'string') return image;
          const upload = await cloudinary.uploader.upload(image, { folder: 'menterprises/services/gallery' });
          return upload.secure_url;
        })
      );
    }

    return this.serviceRepository.create(payload);
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
    const payload = { ...input } as Record<string, unknown>;
    if (payload.thumbnailImage && typeof payload.thumbnailImage === 'string' && payload.thumbnailImage.startsWith('data:')) {
      const upload = await cloudinary.uploader.upload(payload.thumbnailImage, { folder: 'menterprises/services' });
      payload.thumbnailImage = upload.secure_url;
    }

    if (Array.isArray(payload.galleryImages)) {
      payload.galleryImages = await Promise.all(
        payload.galleryImages.map(async (image) => {
          if (typeof image !== 'string') return image;
          if (image.startsWith('data:')) {
            const upload = await cloudinary.uploader.upload(image, { folder: 'menterprises/services/gallery' });
            return upload.secure_url;
          }
          return image;
        })
      );
    }

    return this.serviceRepository.update(id, payload);
  }

  async deleteService(id: string) {
    return this.serviceRepository.softDelete(id);
  }

  async listPublicServices(query: Record<string, unknown> = {}) {
    return this.serviceRepository.listPublic(query);
  }
}
