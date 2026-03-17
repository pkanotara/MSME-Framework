import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  listMenuCategories,
  listMenuItems,
  updateMenuCategory,
  updateMenuItem
} from '../controllers/menu.controller';
import { validateRequest } from '../middleware/validateRequest';
import { menuCategorySchema, menuItemSchema } from '../validators/menu.validator';
import { authGuard } from '../middleware/auth';

const router = Router();

router.use(authGuard);
router.post('/categories', validateRequest(menuCategorySchema), asyncHandler(createMenuCategory));
router.get('/categories/:restaurantId', asyncHandler(listMenuCategories));
router.patch('/categories/:id', asyncHandler(updateMenuCategory));
router.delete('/categories/:id', asyncHandler(deleteMenuCategory));

router.post('/items', validateRequest(menuItemSchema), asyncHandler(createMenuItem));
router.get('/items/:restaurantId', asyncHandler(listMenuItems));
router.patch('/items/:id', asyncHandler(updateMenuItem));
router.delete('/items/:id', asyncHandler(deleteMenuItem));

export default router;
