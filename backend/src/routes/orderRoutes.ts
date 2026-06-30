import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { OrderService } from '../services/orderService.js';
import { createOrderSchema, orderQuerySchema, orderStatusPatchSchema, updateOrderSchema } from '../validators/orderValidators.js';

const router = Router();
const orderRepository = new OrderRepository();
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

router.post('/', authenticateAdmin, validateRequest(createOrderSchema), orderController.createOrder);
router.get('/', authenticateAdmin, validateRequest(orderQuerySchema, 'query'), orderController.getOrders);
router.get('/customer/:customerId', authenticateAdmin, orderController.getCustomerOrders);
router.get('/:id', authenticateAdmin, orderController.getOrderById);
router.put('/:id', authenticateAdmin, validateRequest(updateOrderSchema), orderController.updateOrder);
router.patch('/:id/status', authenticateAdmin, validateRequest(orderStatusPatchSchema), orderController.updateOrderStatus);
router.delete('/:id', authenticateAdmin, orderController.deleteOrder);

export default router;
