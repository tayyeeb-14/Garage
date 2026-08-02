import { z } from 'zod';

const paymentMethods = ['cash', 'upi', 'card'] as const;
const paymentStatuses = ['pending', 'paid'] as const;
const orderStatuses = ['pending', 'confirmed', 'in_service', 'ready_for_pickup', 'completed', 'cancelled'] as const;

const orderPartSchema = z.object({
  item: z.string().min(1, 'Part item is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  name: z.string().optional(),
  sku: z.string().optional(),
});

export const createOrderSchema = z.object({
  booking: z.string().optional(),
  customer: z.string().optional(),
  vehicle: z.string().optional(),
  services: z.array(z.string()).optional(),
  parts: z.array(orderPartSchema).optional(),
  shippingAddress: z.string().max(250).optional(),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  paymentStatus: z.enum(paymentStatuses).optional(),
  orderStatus: z.enum(orderStatuses).optional(),
  notes: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if ((!data.services || data.services.length === 0) && (!data.parts || data.parts.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one service or part is required',
      path: ['services'],
    });
  }
});

export const updateOrderSchema = createOrderSchema.partial();

export const orderQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  sort: z.string().optional(),
});

export const orderStatusPatchSchema = z.object({
  orderStatus: z.enum(orderStatuses),
  paymentStatus: z.enum(paymentStatuses).optional(),
});
