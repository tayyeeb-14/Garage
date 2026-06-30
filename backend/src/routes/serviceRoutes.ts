import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';
import { ServiceService } from '../services/serviceService.js';
import { ServiceRepository } from '../repositories/serviceRepository.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createServiceSchema, updateServiceSchema, serviceQuerySchema } from '../validators/serviceValidators.js';

const router = Router();
const serviceRepository = new ServiceRepository();
const serviceService = new ServiceService(serviceRepository);
const serviceController = new ServiceController(serviceService);

router.get('/public', serviceController.getPublicServices);
router.get('/', authenticateAdmin, validateRequest(serviceQuerySchema, 'query'), serviceController.getServices);
router.get('/:id', authenticateAdmin, serviceController.getServiceById);
router.post('/', authenticateAdmin, validateRequest(createServiceSchema), serviceController.createService);
router.put('/:id', authenticateAdmin, validateRequest(updateServiceSchema), serviceController.updateService);
router.delete('/:id', authenticateAdmin, serviceController.deleteService);

export default router;
