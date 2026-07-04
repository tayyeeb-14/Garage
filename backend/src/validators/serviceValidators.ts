import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name cannot exceed 120 characters'),
  category: z.string({ required_error: 'Category is required', invalid_type_error: 'Category must be a string' })
    .trim()
    .min(1, 'Category is required'),
  description: z.string({ invalid_type_error: 'Description must be a string' }).max(2000, 'Description cannot exceed 2000 characters').optional(),
  price: z.preprocess((value) => {
    if (typeof value === 'string') return Number(value);
    return value;
  }, z.number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' }).min(0, 'Price cannot be negative')),
  estimatedDuration: z.preprocess((value) => {
    if (typeof value === 'string') return Number(value);
    return value;
  }, z.number({ invalid_type_error: 'Estimated duration must be a number' })
    .min(15, 'Estimated time must be at least 15 minutes')
    .optional()),
  thumbnailImage: z.string({ invalid_type_error: 'Thumbnail image must be a string' }).optional(),
  galleryImages: z.array(z.string({ invalid_type_error: 'Gallery image must be a string' })).optional(),
  isActive: z.preprocess((value) => {
    if (typeof value === 'string') return value === 'true';
    return value;
  }, z.boolean({ invalid_type_error: 'isActive must be a boolean' }).optional()),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
});
