import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/serviceService.js';

export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Controller createService body:', req.body);
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
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const service = await this.serviceService.getServiceById(id);
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
      console.log('Controller updateService body:', req.body);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const service = await this.serviceService.updateService(id, req.body);
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
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const service = await this.serviceService.deleteService(id);
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
