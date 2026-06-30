import { NextFunction, Request, Response } from 'express';
import { VehicleRepository } from '../repositories/vehicleRepository.js';

export class VehicleController {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  getVehicles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicles = await this.vehicleRepository.findAll(req.query as Record<string, unknown>);
      res.json({ success: true, data: vehicles });
    } catch (error) {
      next(error);
    }
  };
}
