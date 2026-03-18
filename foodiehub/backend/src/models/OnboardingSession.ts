import { Schema, model, Document, Types } from 'mongoose';

export interface IOnboardingSession extends Document {
  restaurantId?: Types.ObjectId;
  ownerId?: Types.ObjectId;
  sourcePhone: string;
  step:
    | 'started'
    | 'owner_name'
    | 'restaurant_name'
    | 'target_business_number'
    | 'email'
    | 'address'
    | 'business_description'
    | 'working_hours'
    | 'food_categories'
    | 'menu_items'
    | 'logo'
    | 'meta_signup_pending'
    | 'completed';
  data: Record<string, unknown>;
  status: 'in_progress' | 'awaiting_meta_signup' | 'active' | 'abandoned';
}

const onboardingSessionSchema = new Schema<IOnboardingSession>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    sourcePhone: { type: String, required: true, index: true },
    step: {
      type: String,
      enum: [
        'started',
        'owner_name',
        'restaurant_name',
        'target_business_number',
        'email',
        'address',
        'business_description',
        'working_hours',
        'food_categories',
        'menu_items',
        'logo',
        'meta_signup_pending',
        'completed'
      ],
      default: 'started'
    },
    data: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['in_progress', 'awaiting_meta_signup', 'active', 'abandoned'], default: 'in_progress' }
  },
  { timestamps: true }
);

export const OnboardingSessionModel = model<IOnboardingSession>('OnboardingSession', onboardingSessionSchema);
