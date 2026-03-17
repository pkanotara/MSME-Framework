import { Request, Response } from 'express';
import { MenuCategoryModel } from '../models/MenuCategory';
import { MenuItemModel } from '../models/MenuItem';

export const createMenuCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await MenuCategoryModel.create(req.body);
  res.status(201).json(category);
};

export const listMenuCategories = async (req: Request, res: Response): Promise<void> => {
  const categories = await MenuCategoryModel.find({ restaurantId: req.params.restaurantId }).sort({ sortOrder: 1 });
  res.json(categories);
};

export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  const item = await MenuItemModel.create(req.body);
  res.status(201).json(item);
};

export const listMenuItems = async (req: Request, res: Response): Promise<void> => {
  const items = await MenuItemModel.find({ restaurantId: req.params.restaurantId });
  res.json(items);
};
