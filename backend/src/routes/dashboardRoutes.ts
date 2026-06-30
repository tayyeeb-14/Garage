import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { DashboardRepository } from '../repositories/dashboardRepository.js';
import { DashboardService } from '../services/dashboardService.js';

const router = Router();
const dashboardRepository = new DashboardRepository();
const dashboardService = new DashboardService(dashboardRepository);
const dashboardController = new DashboardController(dashboardService);

router.get('/stats', dashboardController.getStats);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/low-stock', dashboardController.getLowStock);
router.get('/top-services', dashboardController.getTopServices);

export default router;
