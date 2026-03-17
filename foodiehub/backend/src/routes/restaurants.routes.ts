import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createRestaurant, deleteRestaurant, getRestaurant, listRestaurants, updateRestaurant } from '../controllers/restaurants.controller';
import { validateRequest } from '../middleware/validateRequest';
import { restaurantCreateSchema, restaurantUpdateSchema } from '../validators/restaurant.validator';

const router = Router();

router.post('/', validateRequest(restaurantCreateSchema), asyncHandler(createRestaurant));
router.get('/', asyncHandler(listRestaurants));
router.get('/:id', asyncHandler(getRestaurant));
router.put('/:id', validateRequest(restaurantUpdateSchema), asyncHandler(updateRestaurant));
router.delete('/:id', asyncHandler(deleteRestaurant));

export default router;
