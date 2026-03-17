import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurant extends Document {
  ownerId: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  workingHours: string;
  foodCategories: string[];
  onboardingStatus: 'pending' | 'meta_connected' | 'completed' | 'active';
  isActive: boolean;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    foodCategories: [{ type: String }],
    onboardingStatus: { type: String, enum: ['pending', 'meta_connected', 'completed', 'active'], default: 'pending' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const RestaurantModel = model<IRestaurant>('Restaurant', restaurantSchema);
