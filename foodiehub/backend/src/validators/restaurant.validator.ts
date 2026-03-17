import { z } from 'zod';

export const restaurantCreateSchema = z.object({
  body: z.object({
    ownerId: z.string(),
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    address: z.string().min(5),
    description: z.string().optional(),
    workingHours: z.string().optional(),
    foodCategories: z.array(z.string()).optional()
  })
});

export const restaurantUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    email: z.string().email().optional(),
    address: z.string().min(5).optional(),
    description: z.string().optional(),
    workingHours: z.string().optional(),
    foodCategories: z.array(z.string()).optional(),
    onboardingStatus: z.enum(['pending', 'meta_connected', 'completed', 'active']).optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({ id: z.string() })
});
