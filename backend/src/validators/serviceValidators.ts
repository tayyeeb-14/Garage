import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  estimatedDuration: z.number().min(15, 'Estimated time must be at least 15 minutes').optional(),
  thumbnailImage: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
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
