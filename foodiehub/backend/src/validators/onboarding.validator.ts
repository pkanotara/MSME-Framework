import { z } from 'zod';

export const onboardingStartSchema = z.object({
  body: z.object({}).optional()
});

export const onboardingDetailsSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    address: z.string().min(5),
    description: z.string().optional(),
    workingHours: z.string().optional(),
    foodCategories: z.array(z.string()).optional()
  }),
  params: z.object({
    id: z.string()
  })
});
