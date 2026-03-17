import { Request, Response } from 'express';
import { RestaurantModel } from '../models/Restaurant';

export const createRestaurant = async (req: Request, res: Response): Promise<void> => {
  const restaurant = await RestaurantModel.create(req.body);
  res.status(201).json(restaurant);
};

export const listRestaurants = async (_req: Request, res: Response): Promise<void> => {
  const records = await RestaurantModel.find().sort({ createdAt: -1 });
  res.json(records);
};

export const getRestaurant = async (req: Request, res: Response): Promise<void> => {
  const record = await RestaurantModel.findById(req.params.id);
  res.json(record);
};

export const updateRestaurant = async (req: Request, res: Response): Promise<void> => {
  const record = await RestaurantModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(record);
};

export const deleteRestaurant = async (req: Request, res: Response): Promise<void> => {
  await RestaurantModel.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
