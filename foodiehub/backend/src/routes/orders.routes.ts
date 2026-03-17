import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createOrder, listOrders } from '../controllers/orders.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createOrderSchema } from '../validators/orders.validator';

const router = Router();

router.post('/', validateRequest(createOrderSchema), asyncHandler(createOrder));
router.get('/', asyncHandler(listOrders));

export default router;
