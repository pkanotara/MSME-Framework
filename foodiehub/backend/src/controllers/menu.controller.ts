import { Response } from 'express';
import { MenuCategoryModel } from '../models/MenuCategory';
import { MenuItemModel } from '../models/MenuItem';
import { AuthRequest } from '../types/express';
import { ROLES } from '../types/roles';

const scopedRestaurantId = (req: AuthRequest, fallback?: string): string | undefined =>
  req.user?.role === ROLES.SUPER_ADMIN ? fallback : req.user?.restaurantId;

export const createMenuCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = scopedRestaurantId(req, req.body.restaurantId);
  const category = await MenuCategoryModel.create({ ...req.body, restaurantId });
  res.status(201).json(category);
};

export const listMenuCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = scopedRestaurantId(req, req.params.restaurantId);
  const categories = await MenuCategoryModel.find({ restaurantId }).sort({ sortOrder: 1 });
  res.json(categories);
};

export const updateMenuCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const category = await MenuCategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
};

export const deleteMenuCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  await MenuCategoryModel.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};

export const createMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = scopedRestaurantId(req, req.body.restaurantId);
  const item = await MenuItemModel.create({ ...req.body, restaurantId });
  res.status(201).json(item);
};

export const listMenuItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = scopedRestaurantId(req, req.params.restaurantId);
  const items = await MenuItemModel.find({ restaurantId });
  res.json(items);
};

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await MenuItemModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
};

export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  await MenuItemModel.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
