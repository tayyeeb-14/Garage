import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService.js';

export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  createInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inventory = await this.inventoryService.createInventory(req.body);
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

  getInventoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const inventory = await this.inventoryService.getInventoryById(id);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  };

  updateInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const inventory = await this.inventoryService.updateInventory(id, req.body);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  };

  deleteInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const inventory = await this.inventoryService.deleteInventory(id);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      res.json({ success: true, data: inventory, message: 'Inventory item deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  stockIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { quantity } = req.body;
      const inventory = await this.inventoryService.stockIn(id, quantity);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      res.json({ success: true, data: inventory, message: 'Stock in successful' });
    } catch (error) {
      next(error);
    }
  };

  stockOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { quantity } = req.body;
      const inventory = await this.inventoryService.stockOut(id, quantity);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      res.json({ success: true, data: inventory, message: 'Stock out successful' });
    } catch (error) {
      next(error);
    }
  };

  getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit || 10);
      const items = await this.inventoryService.getLowStockItems(limit);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  getOutOfStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit || 10);
      const items = await this.inventoryService.getOutOfStockItems(limit);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.inventoryService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
