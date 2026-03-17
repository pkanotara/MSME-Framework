import { Request, Response } from 'express';
import { RestaurantModel } from '../models/Restaurant';
import { OrderModel } from '../models/Order';
import { UserModel } from '../models/User';
import { WhatsAppConfigModel } from '../models/WhatsAppConfig';

export const adminSummary = async (_req: Request, res: Response): Promise<void> => {
  const [restaurants, orders, owners] = await Promise.all([
    RestaurantModel.countDocuments(),
    OrderModel.countDocuments(),
    UserModel.countDocuments({ role: 'restaurant_owner' })
  ]);

  const revenueAgg = await OrderModel.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }]);
  res.json({
    restaurants,
    orders,
    owners,
    totalRevenue: revenueAgg[0]?.totalRevenue ?? 0
  });
};

export const adminRestaurantStatus = async (_req: Request, res: Response): Promise<void> => {
  const data = await RestaurantModel.aggregate([
    {
      $lookup: {
        from: 'whatsappconfigs',
        localField: '_id',
        foreignField: 'restaurantId',
        as: 'wa'
      }
    },
    {
      $project: {
        name: 1,
        onboardingStatus: 1,
        isActive: 1,
        phone: 1,
        wabaId: { $arrayElemAt: ['$wa.wabaId', 0] },
        phoneNumberId: { $arrayElemAt: ['$wa.phoneNumberId', 0] }
      }
    }
  ]);
  res.json(data);
};

export const toggleRestaurantActive = async (req: Request, res: Response): Promise<void> => {
  const restaurant = await RestaurantModel.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json(restaurant);
};

export const botStatus = async (_req: Request, res: Response): Promise<void> => {
  const records = await WhatsAppConfigModel.find({}, { restaurantId: 1, botStatus: 1, signupStatus: 1, normalizedTargetBusinessNumber: 1 });
  res.json(records);
};
