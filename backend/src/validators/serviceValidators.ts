import { z } from 'zod';

const numberField = (label: string, required = false) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return required ? undefined : 0;
    if (typeof value === 'string') return Number(value);
    return value;
  }, required
    ? z.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` }).finite()
    : z.number({ invalid_type_error: `${label} must be a number` }).finite());

const booleanField = z.preprocess((value) => {
  if (typeof value === 'string') return value === 'true';
  return value;
}, z.boolean({ invalid_type_error: 'Value must be a boolean' }).optional());

const stringArrayField = z.preprocess((value) => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return value.split('\n').map((item) => item.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}, z.array(z.string().max(300)).max(30).optional());

const faqField = z.preprocess((value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value ?? [];
}, z.array(z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(1000),
})).max(20).optional());

const relatedServicesField = z.preprocess((value) => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(value)) return value.map(String);
  return [];
}, z.array(z.string()).max(12).optional());

const serviceFields = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  category: z.string().trim().min(1, 'Category is required').max(80),
  description: z.string().trim().max(2000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  fullDescription: z.string().trim().max(5000).optional(),
  price: numberField('Price', true).pipe(z.number().min(0, 'Price cannot be negative')),
  originalPrice: numberField('Original price').pipe(z.number().min(0)).optional(),
  discountPercent: numberField('Discount percent').pipe(z.number().min(0).max(100)).optional(),
  estimatedDuration: numberField('Estimated duration').pipe(z.number().int().min(15).max(480)).optional(),
  includes: stringArrayField,
  faq: faqField,
  compatibleVehicles: stringArrayField,
  relatedServices: relatedServicesField,
  rating: numberField('Rating').pipe(z.number().min(0).max(5)).optional(),
  isActive: booleanField,
  isFeatured: booleanField,
  removeThumbnail: booleanField,
};

export const createServiceSchema = z.object(serviceFields);

export const updateServiceSchema = z.object(serviceFields).partial();

export const serviceQuerySchema = z.object({
  page: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().int().min(1).optional(),
  ),
  limit: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().int().min(1).max(100).optional(),
  ),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum([
    'date-desc',
    'date-asc',
    'name-asc',
    'name-desc',
    'price-asc',
    'price-desc',
    'duration-asc',
    'duration-desc',
  ]).optional(),
});

export const publicServiceQuerySchema = z.object({
  page: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().int().min(1).optional(),
  ),
  limit: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().int().min(1).max(100).optional(),
  ),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum([
    'date-desc',
    'date-asc',
    'name-asc',
    'name-desc',
    'price-asc',
    'price-desc',
    'featured',
  ]).optional(),
});
