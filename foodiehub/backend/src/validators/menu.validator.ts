import { z } from 'zod';

export const menuCategorySchema = z.object({
  body: z.object({
    restaurantId: z.string(),
    name: z.string().min(2),
    sortOrder: z.number().int().optional()
  })
});

export const menuItemSchema = z.object({
  body: z.object({
    restaurantId: z.string(),
    categoryId: z.string(),
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.number().positive(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().optional()
  })
});
