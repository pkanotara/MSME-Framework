import { Document, Schema, Types, model } from 'mongoose';

export interface IWhatsAppConfig extends Document {
  restaurantId: Types.ObjectId;
  targetBusinessNumber: string;
  normalizedTargetBusinessNumber: string;
  wabaId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  signupStatus: 'pending' | 'completed' | 'failed';
  botStatus: 'active' | 'inactive';
}

const whatsAppConfigSchema = new Schema<IWhatsAppConfig>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
    targetBusinessNumber: { type: String, required: true },
    normalizedTargetBusinessNumber: { type: String, required: true, unique: true },
    wabaId: { type: String },
    phoneNumberId: { type: String },
    businessAccountId: { type: String },
    accessToken: { type: String },
    signupStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    botStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive' }
  },
  { timestamps: true }
);

export const WhatsAppConfigModel = model<IWhatsAppConfig>('WhatsAppConfig', whatsAppConfigSchema);
