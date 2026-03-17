import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { OrderModel } from '../models/Order';

export const restaurantAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const restaurantId = req.user?.restaurantId ?? (req.query.restaurantId as string);

  const [totals] = await OrderModel.aggregate([
    { $match: { restaurantId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: '$totalAmount' }
      }
    }
  ]);

  res.json({
    totalOrders: totals?.totalOrders ?? 0,
    totalSales: totals?.totalSales ?? 0
  });
};
