import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurant extends Document {
  ownerId: Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  cuisineType: string;
  onboardingStatus: 'pending' | 'meta_connected' | 'completed';
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    cuisineType: { type: String, required: true },
    onboardingStatus: { type: String, enum: ['pending', 'meta_connected', 'completed'], default: 'pending' }
  },
  { timestamps: true }
);

export const RestaurantModel = model<IRestaurant>('Restaurant', restaurantSchema);
