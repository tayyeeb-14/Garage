import { CategoryRepository } from '../repositories/categoryRepository.js';

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listCategories() {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: string) {
    return this.categoryRepository.findById(id);
  }
}
