import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';
import { ServiceService } from '../services/serviceService.js';
import { ServiceRepository } from '../repositories/serviceRepository.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createServiceSchema, publicServiceQuerySchema, serviceQuerySchema, updateServiceSchema } from '../validators/serviceValidators.js';
import { serviceImageUpload } from '../middleware/uploadMiddleware.js';

const router = Router();
const serviceRepository = new ServiceRepository();
const serviceService = new ServiceService(serviceRepository);
const serviceController = new ServiceController(serviceService);

router.get('/public', validateRequest(publicServiceQuerySchema, 'query'), serviceController.getPublicServices);
router.get('/public/:id', serviceController.getPublicServiceById);
router.get('/categories', serviceController.getCategories);
router.get('/', authenticateAdmin, validateRequest(serviceQuerySchema, 'query'), serviceController.getServices);
router.get('/dashboard/stats', authenticateAdmin, serviceController.getDashboardStats);
router.get('/:id', authenticateAdmin, serviceController.getServiceById);
router.post('/', authenticateAdmin, serviceImageUpload, validateRequest(createServiceSchema), serviceController.createService);
router.put('/:id', authenticateAdmin, serviceImageUpload, validateRequest(updateServiceSchema), serviceController.updateService);
router.delete('/:id', authenticateAdmin, serviceController.deleteService);

export default router;
