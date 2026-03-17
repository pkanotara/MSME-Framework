import crypto from 'crypto';
import { OnboardingSessionModel } from '../models/OnboardingSession';
import { RestaurantModel } from '../models/Restaurant';

export class OnboardingService {
  async start(ownerId: string) {
    return OnboardingSessionModel.create({
      ownerId,
      sessionToken: crypto.randomUUID(),
      step: 'started'
    });
  }

  async submitDetails(sessionId: string, details: { name: string; phone: string; address: string; cuisineType: string }, ownerId: string) {
    const restaurant = await RestaurantModel.create({ ownerId, ...details });
    const session = await OnboardingSessionModel.findByIdAndUpdate(
      sessionId,
      { restaurantId: restaurant._id, step: 'details_submitted', data: details },
      { new: true }
    );
    return session;
  }
}
