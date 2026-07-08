import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const imageFileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  if (/^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only JPG, JPEG, PNG, and WEBP image formats are allowed.'));
  }
};

export const serviceImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).fields([
  { name: 'thumbnailImageFile', maxCount: 1 },
  { name: 'galleryImageFiles', maxCount: 10 },
]);

export const bannerImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single('imageFile');

export const inventoryImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).fields([
  { name: 'thumbnailImageFile', maxCount: 1 },
  { name: 'galleryImageFiles', maxCount: 10 },
]);
