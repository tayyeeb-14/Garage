import type { Express } from 'express';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { InventoryService } from '../services/inventoryService.js';

const parseId = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid part id' });
    return null;
  }
  return id;
};

export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  createInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const payload = {
        ...req.body,
        thumbnailImageFile: files?.thumbnailImageFile?.[0],
        galleryImageFiles: files?.galleryImageFiles ?? [],
      };
      const inventory = await this.inventoryService.createInventory(payload);
      res.status(201).json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  };

  getInventories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inventories = await this.inventoryService.listInventory(req.query as Record<string, unknown>);
      res.json({ success: true, data: inventories });
    } catch (error) {
      next(error);
    }
  };

  getPublicParts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parts = await this.inventoryService.listPublicParts(req.query as Record<string, unknown>);
      res.json({ success: true, data: parts });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.inventoryService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  };

  getBrands = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = await this.inventoryService.getBrands();
      res.json({ success: true, data: brands });
    } catch (error) {
      next(error);
    }
  };

  getInventoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const inventory = await this.inventoryService.getInventoryById(id);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Part not found' });
      }
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  updateInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const id = parseId(req, res);
      if (!id) return undefined;
      const payload = {
        ...req.body,
        thumbnailImageFile: files?.thumbnailImageFile?.[0],
        galleryImageFiles: files?.galleryImageFiles ?? [],
      };
      const inventory = await this.inventoryService.updateInventory(id, payload);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Part not found' });
      }
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  deleteInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const inventory = await this.inventoryService.deleteInventory(id);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Part not found' });
      }
      res.json({ success: true, data: inventory, message: 'Part deleted successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  stockIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const { quantity } = req.body;
      const inventory = await this.inventoryService.stockIn(id, quantity);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Part not found' });
      }
      res.json({ success: true, data: inventory, message: 'Stock increased successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  stockOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const { quantity } = req.body;
      const inventory = await this.inventoryService.stockOut(id, quantity);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Part not found' });
      }
      res.json({ success: true, data: inventory, message: 'Stock decreased successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  setStockStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req, res);
      if (!id) return undefined;
      const { status } = req.body;
      const inventory = await this.inventoryService.setStockStatus(id, status);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Part not found' });
      }
      res.json({ success: true, data: inventory, message: 'Stock status updated successfully' });
    } catch (error) {
      next(error);
    }
    return undefined;
  };

  getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const items = await this.inventoryService.getLowStockItems(limit);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  getOutOfStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const items = await this.inventoryService.getOutOfStockItems(limit);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.inventoryService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
