import { FilterQuery, Types } from 'mongoose';
import { Service, IService } from '../models/Service.js';

export class ServiceRepository {
  async create(data: Partial<IService>) {
    return Service.create(data);
  }

  async findById(id: string) {
    return Service.findById(id).lean();
  }

  async findAll(query: Record<string, unknown>, page = 1, limit = 10) {
    const filter: FilterQuery<IService> = { deletedAt: { $exists: false } };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search as string, $options: 'i' } },
        { description: { $regex: query.search as string, $options: 'i' } },
      ];
    }

    if (query.category) {
      filter.category = query.category as string;
    }

    if (query.status) {
      filter.isActive = query.status === 'active';
    }

    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'price-asc') sort.price = 1;
    if (query.sort === 'price-desc') sort.price = -1;
    if (query.sort === 'name-asc') sort.name = 1;
    if (query.sort === 'name-desc') sort.name = -1;

    const [items, total] = await Promise.all([
      Service.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Partial<IService>) {
    return Service.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async softDelete(id: string) {
    return Service.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true }).lean();
  }

  async listPublic(options: Record<string, unknown> = {}) {
    const filter: FilterQuery<IService> = { deletedAt: { $exists: false }, isActive: true };
    if (options.category) filter.category = options.category as string;
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search as string, $options: 'i' } },
        { description: { $regex: options.search as string, $options: 'i' } },
      ];
    }
    return Service.find(filter).sort({ createdAt: -1 }).lean();
  }
}
