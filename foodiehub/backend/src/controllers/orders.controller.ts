import { Response } from 'express';
import { OrderModel } from '../models/Order';
import { AuthRequest } from '../types/express';
import { ROLES } from '../types/roles';

const orderScope = (req: AuthRequest): string | undefined =>
  req.user?.role === ROLES.SUPER_ADMIN ? (req.query.restaurantId as string | undefined) : req.user?.restaurantId;

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const totalAmount = req.body.items.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
  const restaurantId = req.user?.role === ROLES.SUPER_ADMIN ? req.body.restaurantId : req.user?.restaurantId;
  const order = await OrderModel.create({ ...req.body, restaurantId, totalAmount });
  res.status(201).json(order);
};

export const listOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = orderScope(req);
  const orders = await OrderModel.find(restaurantId ? { restaurantId } : {}).sort({ createdAt: -1 });
  res.json(orders);
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await OrderModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(order);
};
