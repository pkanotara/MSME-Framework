import { Schema, model, Document, Types } from 'mongoose';

export interface IMetaConnection extends Document {
  restaurantId: Types.ObjectId;
  wabaId: string;
  phoneNumberId: string;
  businessAccountId?: string;
  permanentAccessToken?: string;
  status: 'connected' | 'needs_action' | 'error';
}

const metaConnectionSchema = new Schema<IMetaConnection>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
    wabaId: { type: String, required: true },
    phoneNumberId: { type: String, required: true },
    businessAccountId: { type: String },
    permanentAccessToken: { type: String },
    status: { type: String, enum: ['connected', 'needs_action', 'error'], default: 'needs_action' }
  },
  { timestamps: true }
);

export const MetaConnectionModel = model<IMetaConnection>('MetaConnection', metaConnectionSchema);
