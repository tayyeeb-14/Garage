import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService.js';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  listCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.categoryService.listCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const category = await this.categoryService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };
}
