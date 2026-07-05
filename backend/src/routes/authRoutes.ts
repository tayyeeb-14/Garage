import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { AuthRepository } from '../repositories/authRepository.js';
import { AuthService } from '../services/authService.js';

const router = Router();
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post('/admin/login', authController.adminLogin);
router.post('/customer/register', authController.customerRegister);
router.post('/customer/login', authController.customerLogin);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/profile', protect(['admin', 'customer']), authController.getProfile);
router.put('/profile', protect(['admin', 'customer']), authController.updateProfile);

export default router;
