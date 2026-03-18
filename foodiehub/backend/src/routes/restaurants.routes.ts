import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createRestaurant, deleteRestaurant, getRestaurant, listRestaurants, updateRestaurant } from '../controllers/restaurants.controller';
import { validateRequest } from '../middleware/validateRequest';
import { restaurantCreateSchema, restaurantUpdateSchema } from '../validators/restaurant.validator';
import { authGuard, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authGuard);
router.post('/', requireRoles('super_admin'), validateRequest(restaurantCreateSchema), asyncHandler(createRestaurant));
router.get('/', asyncHandler(listRestaurants));
router.get('/:id', asyncHandler(getRestaurant));
router.put('/:id', validateRequest(restaurantUpdateSchema), asyncHandler(updateRestaurant));
router.delete('/:id', requireRoles('super_admin'), asyncHandler(deleteRestaurant));

export default router;
