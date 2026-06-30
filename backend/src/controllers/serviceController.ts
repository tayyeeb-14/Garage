import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/serviceService.js';

export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await this.serviceService.createService(req.body);
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  };

  getServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await this.serviceService.listServices(req.query as Record<string, unknown>);
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  };

  getServiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await this.serviceService.getServiceById(req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  };

  updateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await this.serviceService.updateService(req.params.id, req.body);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  };

  deleteService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = await this.serviceService.deleteService(req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service, message: 'Service deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  getPublicServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await this.serviceService.listPublicServices(req.query as Record<string, unknown>);
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  };
}
