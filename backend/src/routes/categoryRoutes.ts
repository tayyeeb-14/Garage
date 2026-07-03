import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.js';
import { CategoryService } from '../services/categoryService.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const router = Router();
const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

router.get('/', authenticateAdmin, categoryController.listCategories);
router.get('/:id', authenticateAdmin, categoryController.getCategoryById);

export default router;
