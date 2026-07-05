import { FilterQuery } from 'mongoose';
import { Banner, IBanner } from '../models/Banner.js';

export class BannerRepository {
  async create(data: Partial<IBanner>) {
    return Banner.create(data);
  }

  async findById(id: string) {
    return Banner.findById(id).lean();
  }

  async findAll(query: Record<string, unknown> = {}) {
    const filter: FilterQuery<IBanner> = {};
    const now = new Date();

    if (query.activeOnly === 'true') {
      filter.isActive = true;
      filter.$and = [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
      ];
    }

    const items = await Banner.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
    return items;
  }

  async update(id: string, data: Partial<IBanner>) {
    return Banner.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string) {
    return Banner.findByIdAndDelete(id).lean();
  }
}
