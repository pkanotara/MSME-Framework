import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string(),
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
