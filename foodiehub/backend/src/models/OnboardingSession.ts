import { Schema, model, Document, Types } from 'mongoose';

export interface IOnboardingSession extends Document {
  restaurantId?: Types.ObjectId;
  ownerId: Types.ObjectId;
  sessionToken: string;
  step: 'started' | 'details_submitted' | 'meta_connected' | 'completed';
  data: Record<string, unknown>;
}

const onboardingSessionSchema = new Schema<IOnboardingSession>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionToken: { type: String, required: true, unique: true },
    step: { type: String, enum: ['started', 'details_submitted', 'meta_connected', 'completed'], default: 'started' },
    data: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const OnboardingSessionModel = model<IOnboardingSession>('OnboardingSession', onboardingSessionSchema);
