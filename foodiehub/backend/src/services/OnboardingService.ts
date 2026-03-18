import { OnboardingSessionModel } from '../models/OnboardingSession';
import { RestaurantModel } from '../models/Restaurant';
import { normalizePhone } from '../utils/phone';

export class OnboardingService {
  async start(ownerId: string) {
    return OnboardingSessionModel.create({
      ownerId,
      sourcePhone: normalizePhone(`+10000000000`),
      step: 'started'
    });
  }

  async submitDetails(
    sessionId: string,
    details: {
      name: string;
      phone: string;
      email: string;
      address: string;
      description?: string;
      workingHours?: string;
      foodCategories?: string[];
    },
    ownerId: string
  ) {
    const normalized = normalizePhone(details.phone);
    const restaurant = await RestaurantModel.create({
      ownerId,
      name: details.name,
      phone: normalized,
      email: details.email,
      address: details.address,
      description: details.description ?? '',
      workingHours: details.workingHours ?? '',
      foodCategories: details.foodCategories ?? []
    });

    return OnboardingSessionModel.findByIdAndUpdate(
      sessionId,
      { restaurantId: restaurant._id, step: 'meta_signup_pending', data: details },
      { new: true }
    );
  }
}
