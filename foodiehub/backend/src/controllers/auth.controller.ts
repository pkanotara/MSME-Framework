import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/apiError';
import { signToken } from '../utils/jwt';
import { ROLES } from '../types/roles';

export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  const existing = await UserModel.findOne({ email: req.body.email });
  if (existing) throw new ApiError(409, 'Email already exists');

  const user = await UserModel.create({ ...req.body, role: ROLES.SUPER_ADMIN });
  res.status(201).json({ id: user.id, email: user.email, role: user.role });
};

export const registerRestaurantOwner = async (req: Request, res: Response): Promise<void> => {
  const existing = await UserModel.findOne({ email: req.body.email });
  if (existing) throw new ApiError(409, 'Email already exists');

  const user = await UserModel.create({ ...req.body, role: ROLES.RESTAURANT_OWNER });
  res.status(201).json({ id: user.id, email: user.email, role: user.role });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const ok = await user.comparePassword(req.body.password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const token = signToken({ id: user.id, email: user.email, role: user.role, restaurantId: user.restaurantId?.toString() });
  res.json({ token });
};
