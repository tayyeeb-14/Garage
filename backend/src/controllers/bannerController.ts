import { NextFunction, Request, Response } from 'express';
import { BannerService } from '../services/bannerService.js';
import type { Express } from 'express';

export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  createBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      const banner = await this.bannerService.createBanner({ ...req.body, imageFile: file });
      res.status(201).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  };

  getBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banners = await this.bannerService.listBanners(req.query as Record<string, unknown>);
      res.json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  };

  getBannerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const banner = await this.bannerService.getBannerById(id);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      return res.json({ success: true, data: banner });
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  updateBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const file = req.file as Express.Multer.File | undefined;
      const banner = await this.bannerService.updateBanner(id, { ...req.body, imageFile: file });
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      return res.json({ success: true, data: banner });
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const banner = await this.bannerService.deleteBanner(id);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      return res.json({ success: true, data: banner, message: 'Banner deleted successfully' });
    } catch (error) {
      next(error);
      return undefined;
    }
  };
}
