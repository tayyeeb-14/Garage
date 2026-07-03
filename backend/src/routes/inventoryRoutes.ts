import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { InventoryRepository } from '../repositories/inventoryRepository.js';
import { InventoryService } from '../services/inventoryService.js';
import {
  createInventorySchema,
  inventoryQuerySchema,
  stockInSchema,
  stockOutSchema,
  updateInventorySchema,
} from '../validators/inventoryValidators.js';

const router = Router();
const inventoryRepository = new InventoryRepository();
const inventoryService = new InventoryService(inventoryRepository);
const inventoryController = new InventoryController(inventoryService);

router.post('/', authenticateAdmin, validateRequest(createInventorySchema), inventoryController.createInventory);
router.get('/', authenticateAdmin, validateRequest(inventoryQuerySchema, 'query'), inventoryController.getInventories);
router.get('/low-stock', authenticateAdmin, inventoryController.getLowStockItems);
router.get('/out-of-stock', authenticateAdmin, inventoryController.getOutOfStockItems);
router.get('/dashboard/stats', authenticateAdmin, inventoryController.getDashboardStats);
router.get('/:id', authenticateAdmin, inventoryController.getInventoryById);
router.put('/:id', authenticateAdmin, validateRequest(updateInventorySchema), inventoryController.updateInventory);
router.patch('/:id/stock-in', authenticateAdmin, validateRequest(stockInSchema), inventoryController.stockIn);
router.patch('/:id/stock-out', authenticateAdmin, validateRequest(stockOutSchema), inventoryController.stockOut);
router.delete('/:id', authenticateAdmin, inventoryController.deleteInventory);

export default router;
