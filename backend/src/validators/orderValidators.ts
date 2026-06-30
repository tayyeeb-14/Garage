import { z } from 'zod';

const paymentMethods = ['cash', 'upi', 'card'] as const;
const paymentStatuses = ['pending', 'paid'] as const;
const orderStatuses = ['pending', 'confirmed', 'in_service', 'ready_for_pickup', 'completed', 'cancelled'] as const;

export const createOrderSchema = z.object({
  booking: z.string().optional(),
  customer: z.string().min(1, 'Customer is required'),
  vehicle: z.string().min(1, 'Vehicle is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  paymentStatus: z.enum(paymentStatuses).optional(),
  orderStatus: z.enum(orderStatuses).optional(),
  notes: z.string().max(1000).optional(),
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
