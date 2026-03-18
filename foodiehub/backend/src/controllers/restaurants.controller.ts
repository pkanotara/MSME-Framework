import { Response } from 'express';
import { RestaurantModel } from '../models/Restaurant';
import { AuthRequest } from '../types/express';
import { ROLES } from '../types/roles';

const restaurantScope = (req: AuthRequest): string | undefined =>
  req.user?.role === ROLES.SUPER_ADMIN ? undefined : req.user?.restaurantId;

export const createRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurant = await RestaurantModel.create(req.body);
  res.status(201).json(restaurant);
};

export const listRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
  const scopeId = restaurantScope(req);
  const records = await RestaurantModel.find(scopeId ? { _id: scopeId } : {}).sort({ createdAt: -1 });
  res.json(records);
};

export const getRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const scopeId = restaurantScope(req);
  const record = await RestaurantModel.findOne(scopeId ? { _id: scopeId } : { _id: req.params.id });
  res.json(record);
};

export const updateRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const scopeId = restaurantScope(req);
  const query = scopeId ? { _id: scopeId } : { _id: req.params.id };
  const record = await RestaurantModel.findOneAndUpdate(query, req.body, { new: true });
  res.json(record);
};

export const deleteRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  const scopeId = restaurantScope(req);
  const query = scopeId ? { _id: scopeId } : { _id: req.params.id };
  await RestaurantModel.findOneAndDelete(query);
  res.sendStatus(204);
};
