import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController.js';
import { VehicleRepository } from '../repositories/vehicleRepository.js';

const router = Router();
const vehicleRepository = new VehicleRepository();
const vehicleController = new VehicleController(vehicleRepository);

router.get('/', vehicleController.getVehicles);

export default router;
