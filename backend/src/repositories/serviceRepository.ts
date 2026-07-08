import { FilterQuery, Types } from 'mongoose';
import { Service, IService } from '../models/Service.js';
import { escapeRegex } from '../utils/regexUtils.js';
import { notDeletedFilter } from '../utils/inventoryFilters.js';

const PUBLIC_FIELDS = '-deletedAt';

const buildSearchFilter = (search: string): FilterQuery<IService>['$or'] => {
  const term = escapeRegex(search.trim());
  return [
    { name: { $regex: term, $options: 'i' } },
    { description: { $regex: term, $options: 'i' } },
    { shortDescription: { $regex: term, $options: 'i' } },
    { category: { $regex: term, $options: 'i' } },
    { compatibleVehicles: { $regex: term, $options: 'i' } },
  ];
};

const buildListFilter = (query: Record<string, unknown>): FilterQuery<IService> => {
  const andConditions: FilterQuery<IService>[] = [notDeletedFilter()];

  if (query.search) {
    andConditions.push({ $or: buildSearchFilter(query.search as string) });
  }

  const filter: FilterQuery<IService> = { $and: andConditions };

  if (query.category) {
    filter.category = { $regex: escapeRegex(String(query.category)), $options: 'i' };
  }

  if (query.status === 'active') {
    filter.isActive = true;
  }

  if (query.status === 'inactive') {
    filter.isActive = false;
  }

  if (query.featured === 'true') {
    filter.isFeatured = true;
  }

  if (query.featured === 'false') {
    filter.isFeatured = false;
  }

  return filter;
};

const buildSort = (query: Record<string, unknown>, defaults: Record<string, 1 | -1>) => {
  const sort: Record<string, 1 | -1> = { ...defaults };
  if (query.sort === 'price-asc') sort.price = 1;
  if (query.sort === 'price-desc') sort.price = -1;
  if (query.sort === 'name-asc') sort.name = 1;
  if (query.sort === 'name-desc') sort.name = -1;
  if (query.sort === 'date-asc') sort.createdAt = 1;
  if (query.sort === 'date-desc') sort.createdAt = -1;
  if (query.sort === 'duration-asc') sort.estimatedDuration = 1;
  if (query.sort === 'duration-desc') sort.estimatedDuration = -1;
  if (query.sort === 'featured') {
    sort.isFeatured = -1;
    sort.createdAt = -1;
  }
  return sort;
};

export class ServiceRepository {
  async create(data: Partial<IService>) {
    return Service.create(data);
  }

  async findById(id: string) {
    return Service.findOne({ _id: id, ...notDeletedFilter() }).lean();
  }

  async findByName(name: string) {
    return Service.findOne({ name: name.trim(), ...notDeletedFilter() }).lean();
  }

  async findAll(query: Record<string, unknown>, page = 1, limit = 10) {
    const filter = buildListFilter(query);
    const sort = buildSort(query, { createdAt: -1 });

    const [items, total] = await Promise.all([
      Service.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findPublic(query: Record<string, unknown>, page = 1, limit = 20) {
    const filter = buildListFilter(query);
    filter.isActive = true;

    const sort = buildSort(query, { isFeatured: -1, createdAt: -1 });

    const [items, total] = await Promise.all([
      Service.find(filter)
        .select(PUBLIC_FIELDS)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findPublicById(id: string) {
    return Service.findOne({ _id: id, ...notDeletedFilter(), isActive: true })
      .select(PUBLIC_FIELDS)
      .populate({
        path: 'relatedServices',
        match: { isActive: true, ...notDeletedFilter() },
        select: PUBLIC_FIELDS,
      })
      .lean();
  }

  async update(id: string, data: Partial<IService>) {
    const existing = await Service.findOne({ _id: id, ...notDeletedFilter() });
    if (!existing) return null;
    return Service.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async softDelete(id: string) {
    const existing = await Service.findOne({ _id: id, ...notDeletedFilter() });
    if (!existing) return null;
    return Service.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), isActive: false },
      { new: true },
    ).lean();
  }

  async getCategories() {
    return Service.distinct('category', notDeletedFilter());
  }

  async getDashboardStats() {
    const filter = notDeletedFilter();
    const [totalServices, activeServices, featuredServices, categoryList, bookingStats] = await Promise.all([
      Service.countDocuments(filter),
      Service.countDocuments({ ...filter, isActive: true }),
      Service.countDocuments({ ...filter, isFeatured: true, isActive: true }),
      Service.distinct('category', filter),
      Service.aggregate([
        { $match: filter },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, totalValue: { $sum: '$price' } } },
      ]),
    ]);

    return {
      totalServices,
      activeServices,
      featuredServices,
      totalCategories: categoryList.filter(Boolean).length,
      averageRating: bookingStats[0]?.avgRating ? Number(bookingStats[0].avgRating.toFixed(1)) : 0,
      catalogValue: bookingStats[0]?.totalValue ?? 0,
    };
  }

  async listPublicLegacy(options: Record<string, unknown> = {}) {
    const result = await this.findPublic(options, 1, 100);
    return result.items;
  }

  normalizeRelatedServices(relatedServices?: string[]) {
    if (!relatedServices?.length) return [];
    return relatedServices
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
  }
}
