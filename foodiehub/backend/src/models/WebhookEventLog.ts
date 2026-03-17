import { Schema, model, Document, Types } from 'mongoose';

export interface IWebhookEventLog extends Document {
  restaurantId?: Types.ObjectId;
  source: 'meta';
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processingError?: string;
}

const webhookEventLogSchema = new Schema<IWebhookEventLog>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    source: { type: String, default: 'meta' },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    processingError: { type: String }
  },
  { timestamps: true }
);

export const WebhookEventLogModel = model<IWebhookEventLog>('WebhookEventLog', webhookEventLogSchema);
