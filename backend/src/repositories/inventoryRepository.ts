import { FilterQuery, Types } from 'mongoose';
import Inventory, { IInventory } from '../models/Inventory.js';

export class InventoryRepository {
  async create(data: Partial<IInventory>) {
    return Inventory.create(data);
  }

  async findById(id: string) {
    return Inventory.findById(id).lean();
  }

  async findBySku(sku: string) {
    return Inventory.findOne({ sku, deletedAt: { $exists: false } }).lean();
  }

  async findAll(query: Record<string, unknown>, page = 1, limit = 10) {
    const filter: FilterQuery<IInventory> = { deletedAt: { $exists: false } };

    if (query.search) {
      filter.$or = [
        { itemName: { $regex: query.search as string, $options: 'i' } },
        { sku: { $regex: query.search as string, $options: 'i' } },
        { category: { $regex: query.search as string, $options: 'i' } },
        { brand: { $regex: query.search as string, $options: 'i' } },
      ];
    }

    if (query.category) {
      filter.category = { $regex: query.category as string, $options: 'i' };
    }

    if (query.brand) {
      filter.brand = { $regex: query.brand as string, $options: 'i' };
    }

    if (query.status) {
      filter.status = query.status as string;
    }

    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'price-asc') sort.sellingPrice = 1;
    if (query.sort === 'price-desc') sort.sellingPrice = -1;
    if (query.sort === 'name-asc') sort.itemName = 1;
    if (query.sort === 'name-desc') sort.itemName = -1;
    if (query.sort === 'quantity-asc') sort.quantity = 1;
    if (query.sort === 'quantity-desc') sort.quantity = -1;
    if (query.sort === 'date-asc') sort.createdAt = 1;
    if (query.sort === 'date-desc') sort.createdAt = -1;

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Partial<IInventory>) {
    return Inventory.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async softDelete(id: string) {
    return Inventory.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).lean();
  }

  async getLowStockItems(limit = 10) {
    return Inventory.find({
      quantity: { $lte: 'minimumStock' },
      deletedAt: { $exists: false },
    })
      .sort({ quantity: 1 })
      .limit(limit)
      .lean();
  }

  async getOutOfStockItems(limit = 10) {
    return Inventory.find({
      quantity: { $eq: 0 },
      deletedAt: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async updateStock(id: string, quantityChange: number) {
    const item = await Inventory.findById(id);
    if (!item) return null;

    const newQuantity = item.quantity + quantityChange;
    let status: 'In Stock' | 'Low Stock' | 'Out Of Stock' = 'In Stock';

    if (newQuantity === 0) {
      status = 'Out Of Stock';
    } else if (newQuantity <= item.minimumStock) {
      status = 'Low Stock';
    }

    return Inventory.findByIdAndUpdate(id, { quantity: newQuantity, status }, { new: true }).lean();
  }

  async getDashboardStats() {
    const [totalItems, totalValue, lowStockCount, outOfStockCount] = await Promise.all([
      Inventory.countDocuments({ deletedAt: { $exists: false } }),
      Inventory.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } } } },
      ]),
      Inventory.countDocuments({ status: 'Low Stock', deletedAt: { $exists: false } }),
      Inventory.countDocuments({ status: 'Out Of Stock', deletedAt: { $exists: false } }),
    ]);

    return {
      totalItems,
      totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
      lowStockCount,
      outOfStockCount,
    };
  }
}
