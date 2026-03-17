import { Document, Schema, Types, model } from 'mongoose';

export interface IActivityLog extends Document {
  actorUserId?: Types.ObjectId;
  restaurantId?: Types.ObjectId;
  action: string;
  metadata?: Record<string, unknown>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const ActivityLogModel = model<IActivityLog>('ActivityLog', activityLogSchema);
