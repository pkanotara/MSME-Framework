import { Document, Schema, Types, model } from 'mongoose';

export interface IBroadcastLog extends Document {
  createdBy: Types.ObjectId;
  restaurantId?: Types.ObjectId;
  message: string;
  audience: 'all' | 'restaurant';
  status: 'queued' | 'sent' | 'failed';
}

const broadcastLogSchema = new Schema<IBroadcastLog>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    message: { type: String, required: true },
    audience: { type: String, enum: ['all', 'restaurant'], required: true },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' }
  },
  { timestamps: true }
);

export const BroadcastLogModel = model<IBroadcastLog>('BroadcastLog', broadcastLogSchema);
