import { z } from 'zod';

export const onboardingStartSchema = z.object({
  body: z.object({})
});

export const onboardingDetailsSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    address: z.string().min(5),
    cuisineType: z.string().min(2)
  }),
  params: z.object({
    id: z.string()
  })
});
