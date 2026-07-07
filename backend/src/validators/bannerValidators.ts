import { z } from 'zod';

const multipartBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '') return undefined;
  return value;
}, z.boolean().optional());

export const createBannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(300).optional(),
  isActive: multipartBoolean,
  displayOrder: z.coerce.number().int().min(0).optional(),
  startDate: z.string().optional().transform((value) => (value ? new Date(value) : undefined)),
  endDate: z.string().optional().transform((value) => (value ? new Date(value) : undefined)),
  ctaText: z.string().trim().max(60).optional(),
  ctaAction: z.enum(['service', 'parts', 'external']).optional(),
  targetId: z.string().trim().optional(),
  targetUrl: z.string().trim().url().optional().or(z.literal('')),
});

export const updateBannerSchema = createBannerSchema.partial();
