import type { Express } from 'express';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ServiceService } from '../services/serviceService.js';

const parseId = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid service id' });
    return null;
  }
  return id;
};

export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const payload = {
        ...req.body,
        thumbnailImageFile: files?.thumbnailImageFile?.[0],
        galleryImageFiles: files?.galleryImageFiles ?? [],
      };
      const service = await this.serviceService.createService(payload);
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
      const id = parseId(req, res);
      if (!id) return undefined;
      const service = await this.serviceService.getServiceById(id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  updateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const id = parseId(req, res);
      if (!id) return undefined;
      const payload = {
        ...req.body,
        thumbnailImageFile: files?.thumbnailImageFile?.[0],
        galleryImageFiles: files?.galleryImageFiles ?? [],
      };
      const service = await this.serviceService.updateService(id, payload);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  deleteService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const service = await this.serviceService.deleteService(id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service, message: 'Service deleted successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  getPublicServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await this.serviceService.listPublicServices(req.query as Record<string, unknown>);
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  };

  getPublicServiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const service = await this.serviceService.getPublicServiceById(id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.serviceService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.serviceService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
