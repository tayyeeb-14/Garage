import { z } from 'zod';

export const createInventorySchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(150),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  compatibleVehicles: z.array(z.string()).default([]),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierPhone: z.string().min(1, 'Supplier phone is required'),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  quantity: z.number().min(0, 'Quantity cannot be negative').default(0),
  minimumStock: z.number().min(0, 'Minimum stock cannot be negative'),
  maximumStock: z.number().min(0, 'Maximum stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  rackLocation: z.string().min(1, 'Rack location is required'),
  image: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const inventoryQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
});

export const stockInSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
});

export const stockOutSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
});
