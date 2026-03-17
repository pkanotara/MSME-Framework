import { Router } from 'express';
import { restaurantAnalytics } from '../controllers/analytics.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authGuard } from '../middleware/auth';

const router = Router();

router.get('/restaurant', authGuard, asyncHandler(restaurantAnalytics));

export default router;
