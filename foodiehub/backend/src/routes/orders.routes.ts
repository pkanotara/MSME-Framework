import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createOrder, listOrders, updateOrderStatus } from '../controllers/orders.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/orders.validator';
import { authGuard } from '../middleware/auth';

const router = Router();

router.use(authGuard);
router.post('/', validateRequest(createOrderSchema), asyncHandler(createOrder));
router.get('/', asyncHandler(listOrders));
router.patch('/:id/status', validateRequest(updateOrderStatusSchema), asyncHandler(updateOrderStatus));

export default router;
