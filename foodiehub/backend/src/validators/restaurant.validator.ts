import { z } from 'zod';

export const restaurantCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    address: z.string().min(5),
    cuisineType: z.string().min(2)
  })
});

export const restaurantUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    address: z.string().min(5).optional(),
    cuisineType: z.string().min(2).optional(),
    onboardingStatus: z.enum(['pending', 'meta_connected', 'completed']).optional()
  }),
  params: z.object({ id: z.string() })
});
