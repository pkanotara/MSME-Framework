import { Document, Schema, Types, model } from 'mongoose';

export interface ISupportTicket extends Document {
  restaurantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' }
  },
  { timestamps: true }
);

export const SupportTicketModel = model<ISupportTicket>('SupportTicket', supportTicketSchema);
