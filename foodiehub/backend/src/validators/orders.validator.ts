import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().optional(),
    customerPhone: z.string().min(8),
    items: z.array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1),
        price: z.number().nonnegative()
      })
    )
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled', 'fulfilled'])
  }),
  params: z.object({
    id: z.string()
  })
});
