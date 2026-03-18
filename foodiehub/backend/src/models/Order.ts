import { Schema, model, Document, Types } from 'mongoose';

interface IOrderItem {
  menuItemId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  restaurantId: Types.ObjectId;
  customerPhone: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';
}

const orderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customerPhone: { type: String, required: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
      }
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'fulfilled'], default: 'pending' }
  },
  { timestamps: true }
);

export const OrderModel = model<IOrder>('Order', orderSchema);
