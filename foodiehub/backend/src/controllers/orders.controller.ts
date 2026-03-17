import { Request, Response } from 'express';
import { OrderModel } from '../models/Order';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const totalAmount = req.body.items.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
  const order = await OrderModel.create({ ...req.body, totalAmount });
  res.status(201).json(order);
};

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  const filter = req.query.restaurantId ? { restaurantId: req.query.restaurantId } : {};
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
  res.json(orders);
};
