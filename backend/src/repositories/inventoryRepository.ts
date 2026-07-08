import { FilterQuery } from 'mongoose';
import Inventory, { IInventory } from '../models/Inventory.js';
import { escapeRegex } from '../utils/regexUtils.js';
import { notDeletedFilter } from '../utils/inventoryFilters.js';

const PUBLIC_FIELDS = '-purchasePrice -supplierName -supplierPhone -rackLocation -barcode -deletedAt';

const computeStatus = (quantity: number, minimumStock: number): IInventory['status'] => {
  if (quantity === 0) return 'Out Of Stock';
  if (quantity <= minimumStock) return 'Low Stock';
  return 'In Stock';
};

const buildSearchFilter = (search: string): FilterQuery<IInventory>['$or'] => {
  const term = escapeRegex(search.trim());
  return [
    { itemName: { $regex: term, $options: 'i' } },
    { sku: { $regex: term, $options: 'i' } },
    { category: { $regex: term, $options: 'i' } },
    { brand: { $regex: term, $options: 'i' } },
    { compatibleVehicles: { $regex: term, $options: 'i' } },
  ];
};

const buildListFilter = (query: Record<string, unknown>): FilterQuery<IInventory> => {
  const andConditions: FilterQuery<IInventory>[] = [notDeletedFilter()];

  if (query.search) {
    andConditions.push({ $or: buildSearchFilter(query.search as string) });
  }

  const filter: FilterQuery<IInventory> = { $and: andConditions };

  if (query.category) {
    filter.category = { $regex: escapeRegex(String(query.category)), $options: 'i' };
  }

  if (query.brand) {
    filter.brand = { $regex: escapeRegex(String(query.brand)), $options: 'i' };
  }

  if (query.status) {
    filter.status = query.status as IInventory['status'];
  }

  if (query.featured === 'true') {
    filter.isFeatured = true;
  }

  if (query.featured === 'false') {
    filter.isFeatured = false;
  }

  if (query.active === 'true') {
    filter.isActive = true;
  }

  if (query.active === 'false') {
    filter.isActive = false;
  }

  return filter;
};

const buildSort = (query: Record<string, unknown>, defaults: Record<string, 1 | -1>) => {
  const sort: Record<string, 1 | -1> = { ...defaults };
  if (query.sort === 'price-asc') sort.sellingPrice = 1;
  if (query.sort === 'price-desc') sort.sellingPrice = -1;
  if (query.sort === 'name-asc') sort.itemName = 1;
  if (query.sort === 'name-desc') sort.itemName = -1;
  if (query.sort === 'quantity-asc') sort.quantity = 1;
  if (query.sort === 'quantity-desc') sort.quantity = -1;
  if (query.sort === 'date-asc') sort.createdAt = 1;
  if (query.sort === 'date-desc') sort.createdAt = -1;
  return sort;
};

export class InventoryRepository {
  async create(data: Partial<IInventory>) {
    const quantity = data.quantity ?? 0;
    const minimumStock = data.minimumStock ?? 5;
    const payload = {
      ...data,
      status: computeStatus(quantity, minimumStock),
    };
    return Inventory.create(payload);
  }

  async findById(id: string) {
    return Inventory.findOne({ _id: id, ...notDeletedFilter() }).lean();
  }

  async findBySku(sku: string) {
    return Inventory.findOne({ sku: sku.trim(), ...notDeletedFilter() }).lean();
  }

  async findAll(query: Record<string, unknown>, page = 1, limit = 10) {
    const filter = buildListFilter(query);
    const sort = buildSort(query, { createdAt: -1 });

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findPublic(query: Record<string, unknown>, page = 1, limit = 20) {
    const filter = buildListFilter(query);
    filter.isActive = true;
    filter.status = { $ne: 'Out Of Stock' };

    const sort = buildSort(query, { isFeatured: -1, createdAt: -1 });

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .select(PUBLIC_FIELDS)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async update(id: string, data: Partial<IInventory>) {
    const existing = await Inventory.findOne({ _id: id, ...notDeletedFilter() });
    if (!existing) return null;

    const quantity = data.quantity ?? existing.quantity;
    const minimumStock = data.minimumStock ?? existing.minimumStock;
    const { status: _ignoredStatus, ...rest } = data;
    const payload = {
      ...rest,
      status: computeStatus(quantity, minimumStock),
    };

    return Inventory.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async softDelete(id: string) {
    const existing = await Inventory.findOne({ _id: id, ...notDeletedFilter() });
    if (!existing) return null;

    return Inventory.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), isActive: false },
      { new: true },
    ).lean();
  }

  async getLowStockItems(limit = 10) {
    return Inventory.find({
      ...notDeletedFilter(),
      $expr: { $lte: ['$quantity', '$minimumStock'] },
      quantity: { $gt: 0 },
    })
      .sort({ quantity: 1 })
      .limit(limit)
      .lean();
  }

  async getOutOfStockItems(limit = 10) {
    return Inventory.find({
      ...notDeletedFilter(),
      quantity: { $eq: 0 },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async updateStock(id: string, quantityChange: number) {
    const item = await Inventory.findOne({ _id: id, ...notDeletedFilter() });
    if (!item) return null;

    if (quantityChange < 0 && item.quantity < Math.abs(quantityChange)) {
      throw new Error('Insufficient stock available');
    }

    const newQuantity = Math.max(0, item.quantity + quantityChange);
    const status = computeStatus(newQuantity, item.minimumStock);

    return Inventory.findByIdAndUpdate(id, { quantity: newQuantity, status }, { new: true }).lean();
  }

  async setStockStatus(id: string, status: 'In Stock' | 'Out Of Stock') {
    const item = await Inventory.findOne({ _id: id, ...notDeletedFilter() });
    if (!item) return null;

    if (status === 'Out Of Stock') {
      return Inventory.findByIdAndUpdate(id, { quantity: 0, status: 'Out Of Stock' }, { new: true }).lean();
    }

    const quantity = item.quantity > 0 ? item.quantity : Math.max(item.minimumStock, 1);
    const nextStatus = computeStatus(quantity, item.minimumStock);
    return Inventory.findByIdAndUpdate(id, { quantity, status: nextStatus }, { new: true }).lean();
  }

  async getCategories() {
    return Inventory.distinct('category', notDeletedFilter());
  }

  async getBrands() {
    return Inventory.distinct('brand', { ...notDeletedFilter(), brand: { $nin: [null, ''] } });
  }

  async getDashboardStats() {
    const filter = notDeletedFilter();
    const [totalItems, activeItems, categoryList, totalValue, lowStockCount, outOfStockCount] = await Promise.all([
      Inventory.countDocuments(filter),
      Inventory.countDocuments({ ...filter, isActive: true }),
      Inventory.distinct('category', filter),
      Inventory.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } } } },
      ]),
      Inventory.countDocuments({
        ...filter,
        $expr: { $lte: ['$quantity', '$minimumStock'] },
        quantity: { $gt: 0 },
      }),
      Inventory.countDocuments({ ...filter, status: 'Out Of Stock' }),
    ]);

    return {
      totalItems,
      activeItems,
      totalCategories: categoryList.filter(Boolean).length,
      totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
      lowStockCount,
      outOfStockCount,
    };
  }
}
