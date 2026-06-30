import { Router } from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { BookingRepository } from '../repositories/bookingRepository.js';
import { BookingService } from '../services/bookingService.js';
import { bookingQuerySchema, createBookingSchema, updateBookingSchema } from '../validators/bookingValidators.js';

const router = Router();
const bookingRepository = new BookingRepository();
const bookingService = new BookingService(bookingRepository);
const bookingController = new BookingController(bookingService);

router.post('/', authenticateAdmin, validateRequest(createBookingSchema), bookingController.createBooking);
router.get('/', authenticateAdmin, validateRequest(bookingQuerySchema, 'query'), bookingController.getBookings);
router.get('/stats', authenticateAdmin, bookingController.getStats);
router.get('/customer/:customerId', authenticateAdmin, bookingController.getCustomerBookings);
router.get('/:id', authenticateAdmin, bookingController.getBookingById);
router.put('/:id', authenticateAdmin, validateRequest(updateBookingSchema), bookingController.updateBooking);
router.delete('/:id', authenticateAdmin, bookingController.deleteBooking);

export default router;
