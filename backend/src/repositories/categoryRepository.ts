import { Category, ICategory } from '../models/Category.js';

export class CategoryRepository {
  async findAll() {
    return Category.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  async findById(id: string) {
    return Category.findById(id).lean();
  }
}
