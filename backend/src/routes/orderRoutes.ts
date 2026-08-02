import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authenticateAdmin, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { InventoryRepository } from '../repositories/inventoryRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { OrderService } from '../services/orderService.js';
import { createOrderSchema, orderQuerySchema, orderStatusPatchSchema, updateOrderSchema } from '../validators/orderValidators.js';

const router = Router();
const orderRepository = new OrderRepository();
const inventoryRepository = new InventoryRepository();
const orderService = new OrderService(orderRepository, inventoryRepository);
const orderController = new OrderController(orderService);

router.post('/', protect(['admin', 'customer']), validateRequest(createOrderSchema), orderController.createOrder);
router.get('/', authenticateAdmin, validateRequest(orderQuerySchema, 'query'), orderController.getOrders);
router.get('/customer/:customerId', protect(['admin', 'customer']), orderController.getCustomerOrders);
router.get('/:id', protect(['admin', 'customer']), orderController.getOrderById);
router.put('/:id', authenticateAdmin, validateRequest(updateOrderSchema), orderController.updateOrder);
router.patch('/:id/status', authenticateAdmin, validateRequest(orderStatusPatchSchema), orderController.updateOrderStatus);
router.delete('/:id', authenticateAdmin, orderController.deleteOrder);

export default router;
