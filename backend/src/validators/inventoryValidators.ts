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

const compatibleVehiclesField = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}, z.array(z.string().max(120)).max(20).optional());

const inventoryFields = {
  itemName: z.string().trim().min(2, 'Item name must be at least 2 characters').max(150),
  sku: z.string().trim().min(1, 'SKU is required').max(80),
  barcode: z.string().trim().max(80).optional(),
  category: z.string().trim().min(1, 'Category is required').max(80),
  brand: z.string().trim().max(80).optional(),
  compatibleVehicles: compatibleVehiclesField,
  supplierName: z.string().trim().max(120).optional(),
  supplierPhone: z.string().trim().max(20).optional(),
  purchasePrice: numberField('Purchase price').pipe(z.number().min(0)).optional(),
  sellingPrice: numberField('Selling price', true).pipe(z.number().min(0, 'Selling price cannot be negative')),
  originalPrice: numberField('Original price').pipe(z.number().min(0)).optional(),
  discountPercent: numberField('Discount percent').pipe(z.number().min(0).max(100)).optional(),
  quantity: numberField('Quantity', true).pipe(z.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative')),
  minimumStock: numberField('Minimum stock').pipe(z.number().int().min(0)).optional(),
  maximumStock: numberField('Maximum stock').pipe(z.number().int().min(0)).optional(),
  unit: z.string().trim().max(30).optional(),
  weight: numberField('Weight').pipe(z.number().min(0)).optional(),
  rackLocation: z.string().trim().max(80).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  fullDescription: z.string().trim().max(5000).optional(),
  description: z.string().trim().max(2000).optional(),
  isActive: booleanField,
  isFeatured: booleanField,
  removeThumbnail: booleanField,
};

export const createInventorySchema = z.object(inventoryFields).superRefine((data, ctx) => {
  if (data.maximumStock !== undefined && data.minimumStock !== undefined && data.maximumStock < data.minimumStock) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum stock must be greater than or equal to minimum stock', path: ['maximumStock'] });
  }
  if (data.quantity !== undefined && data.maximumStock !== undefined && data.quantity > data.maximumStock) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Quantity cannot exceed maximum stock', path: ['quantity'] });
  }
});

export const updateInventorySchema = z.object(inventoryFields).partial().superRefine((data, ctx) => {
  if (data.maximumStock !== undefined && data.minimumStock !== undefined && data.maximumStock < data.minimumStock) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum stock must be greater than or equal to minimum stock', path: ['maximumStock'] });
  }
});

const stockQuantityField = z.preprocess((value) => {
  if (typeof value === 'string') return Number(value);
  return value;
}, z.number({ invalid_type_error: 'Quantity must be a number' }).int().min(1, 'Quantity must be greater than 0'));

export const inventoryQuerySchema = z.object({
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
  brand: z.string().trim().max(80).optional(),
  status: z.enum(['In Stock', 'Low Stock', 'Out Of Stock']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  active: z.enum(['true', 'false']).optional(),
  sort: z.enum([
    'date-desc',
    'date-asc',
    'name-asc',
    'name-desc',
    'price-asc',
    'price-desc',
    'quantity-asc',
    'quantity-desc',
  ]).optional(),
});

export const stockInSchema = z.object({
  quantity: stockQuantityField,
});

export const stockOutSchema = z.object({
  quantity: stockQuantityField,
});

export const stockStatusSchema = z.object({
  status: z.enum(['In Stock', 'Out Of Stock']),
});
