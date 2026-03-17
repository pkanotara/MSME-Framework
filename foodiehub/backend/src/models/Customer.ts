import { Document, Schema, Types, model } from 'mongoose';

export interface ICustomer extends Document {
  restaurantId: Types.ObjectId;
  phone: string;
  name?: string;
  lastOrderAt?: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    phone: { type: String, required: true },
    name: { type: String },
    lastOrderAt: { type: Date }
  },
  { timestamps: true }
);

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });

export const CustomerModel = model<ICustomer>('Customer', customerSchema);
