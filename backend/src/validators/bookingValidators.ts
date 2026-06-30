import { z } from 'zod';

const statusValues = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());
const isValidTimeString = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const createBookingSchema = z.object({
  customer: z.string().optional(),
  vehicle: z.string().min(1, 'Vehicle is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  bookingDate: z.string().refine(isValidDateString, 'Booking date is invalid'),
  preferredTime: z.string().refine(isValidTimeString, 'Preferred time must be HH:MM'),
  pickupRequired: z.boolean(),
  address: z.string().min(3, 'Address is required').max(300),
  notes: z.string().max(1000).optional(),
  status: z.enum(statusValues).optional(),
});

export const updateBookingSchema = createBookingSchema.partial().extend({
  status: z.enum(statusValues).optional(),
});

export const bookingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
});
