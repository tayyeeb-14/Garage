import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { inventoryImageUpload } from '../middleware/uploadMiddleware.js';
import { InventoryRepository } from '../repositories/inventoryRepository.js';
import { InventoryService } from '../services/inventoryService.js';
import {
  createInventorySchema,
  inventoryQuerySchema,
  stockInSchema,
  stockOutSchema,
  stockStatusSchema,
  updateInventorySchema,
} from '../validators/inventoryValidators.js';

const router = Router();
const inventoryRepository = new InventoryRepository();
const inventoryService = new InventoryService(inventoryRepository);
const inventoryController = new InventoryController(inventoryService);

router.get('/public', inventoryController.getPublicParts);
router.get('/categories', inventoryController.getCategories);
router.get('/brands', inventoryController.getBrands);
router.post('/', authenticateAdmin, inventoryImageUpload, validateRequest(createInventorySchema), inventoryController.createInventory);
router.get('/', authenticateAdmin, validateRequest(inventoryQuerySchema, 'query'), inventoryController.getInventories);
router.get('/low-stock', authenticateAdmin, inventoryController.getLowStockItems);
router.get('/out-of-stock', authenticateAdmin, inventoryController.getOutOfStockItems);
router.get('/dashboard/stats', authenticateAdmin, inventoryController.getDashboardStats);
router.get('/:id', authenticateAdmin, inventoryController.getInventoryById);
router.put('/:id', authenticateAdmin, inventoryImageUpload, validateRequest(updateInventorySchema), inventoryController.updateInventory);
router.patch('/:id/stock-in', authenticateAdmin, validateRequest(stockInSchema), inventoryController.stockIn);
router.patch('/:id/stock-out', authenticateAdmin, validateRequest(stockOutSchema), inventoryController.stockOut);
router.patch('/:id/stock-status', authenticateAdmin, validateRequest(stockStatusSchema), inventoryController.setStockStatus);
router.delete('/:id', authenticateAdmin, inventoryController.deleteInventory);

export default router;
