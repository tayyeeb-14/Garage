import { Router } from 'express';
import { BannerController } from '../controllers/bannerController.js';
import { BannerService } from '../services/bannerService.js';
import { BannerRepository } from '../repositories/bannerRepository.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createBannerSchema, updateBannerSchema } from '../validators/bannerValidators.js';
import { bannerImageUpload } from '../middleware/uploadMiddleware.js';

const router = Router();
const bannerRepository = new BannerRepository();
const bannerService = new BannerService(bannerRepository);
const bannerController = new BannerController(bannerService);

router.get('/', bannerController.getBanners);
router.get('/:id', bannerController.getBannerById);
router.post('/', authenticateAdmin, bannerImageUpload, validateRequest(createBannerSchema), bannerController.createBanner);
router.put('/:id', authenticateAdmin, bannerImageUpload, validateRequest(updateBannerSchema), bannerController.updateBanner);
router.delete('/:id', authenticateAdmin, bannerController.deleteBanner);

export default router;
