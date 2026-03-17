import { Schema, model, Document, Types } from 'mongoose';

export interface ICartSession extends Document {
  restaurantId: Types.ObjectId;
  customerPhone: string;
  items: {
    menuItemId: Types.ObjectId;
    quantity: number;
  }[];
  expiresAt: Date;
}

const cartSessionSchema = new Schema<ICartSession>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customerPhone: { type: String, required: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, min: 1, required: true }
      }
    ],
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

cartSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CartSessionModel = model<ICartSession>('CartSession', cartSessionSchema);
