import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createMenuCategory, createMenuItem, listMenuCategories, listMenuItems } from '../controllers/menu.controller';
import { validateRequest } from '../middleware/validateRequest';
import { menuCategorySchema, menuItemSchema } from '../validators/menu.validator';

const router = Router();

router.post('/categories', validateRequest(menuCategorySchema), asyncHandler(createMenuCategory));
router.get('/categories/:restaurantId', asyncHandler(listMenuCategories));
router.post('/items', validateRequest(menuItemSchema), asyncHandler(createMenuItem));
router.get('/items/:restaurantId', asyncHandler(listMenuItems));

export default router;
