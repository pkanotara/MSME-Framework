import { Router } from 'express';
import { adminRestaurantStatus, adminSummary, botStatus, toggleRestaurantActive } from '../controllers/admin.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authGuard, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authGuard, requireRoles('super_admin'));
router.get('/summary', asyncHandler(adminSummary));
router.get('/restaurants/status', asyncHandler(adminRestaurantStatus));
router.patch('/restaurants/:id/active', asyncHandler(toggleRestaurantActive));
router.get('/bots/status', asyncHandler(botStatus));

export default router;
