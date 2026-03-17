import { OnboardingSessionModel } from '../models/OnboardingSession';
import { RestaurantModel } from '../models/Restaurant';
import { normalizePhone } from '../utils/phone';
import { WhatsAppConfigModel } from '../models/WhatsAppConfig';

const QUESTIONS: Record<string, string> = {
  started: 'Welcome to FoodieHub Onboarding. What is your full name (owner name)?',
  owner_name: 'Great. What is your restaurant name?',
  restaurant_name:
    'Which phone number do you want to use as your restaurant’s WhatsApp Business number? (include country code)',
  target_business_number: 'Please share your business email address.',
  email: 'Please share your restaurant address.',
  address: 'Please provide a short business description.',
  business_description: 'What are your working hours?',
  working_hours: 'List your food categories separated by commas.',
  food_categories: 'Please send your menu items (name|description|price|category), one per line.',
  menu_items: 'Optional: send a logo image URL, or type SKIP.',
  logo: 'Thanks! Your details are collected. Complete Meta signup using the link we send next.'
};

const NEXT_STEP: Record<string, string> = {
  started: 'owner_name',
  owner_name: 'restaurant_name',
  restaurant_name: 'target_business_number',
  target_business_number: 'email',
  email: 'address',
  address: 'business_description',
  business_description: 'working_hours',
  working_hours: 'food_categories',
  food_categories: 'menu_items',
  menu_items: 'logo',
  logo: 'meta_signup_pending'
};

export class OnboardingChatService {
  async processIncomingMessage(sourcePhone: string, text: string): Promise<{ reply: string; completed: boolean; restaurantId?: string }> {
    const normalizedSource = normalizePhone(sourcePhone);
    let session = await OnboardingSessionModel.findOne({ sourcePhone: normalizedSource, status: { $in: ['in_progress', 'awaiting_meta_signup'] } }).sort({ createdAt: -1 });

    if (!session) {
      session = await OnboardingSessionModel.create({ sourcePhone: normalizedSource, step: 'started', status: 'in_progress', data: {} });
      return { reply: QUESTIONS.started, completed: false };
    }

    if (session.step === 'meta_signup_pending') {
      return { reply: 'You have already completed chat onboarding. Please finish Meta Embedded Signup from your link.', completed: false };
    }

    const currentStep = session.step;
    const nextStep = NEXT_STEP[currentStep];
    const data = { ...session.data } as Record<string, unknown>;

    if (currentStep === 'target_business_number') {
      const normalizedTarget = normalizePhone(text);
      const existing = await WhatsAppConfigModel.findOne({ normalizedTargetBusinessNumber: normalizedTarget });
      if (existing) {
        return { reply: 'This number is already onboarded. Please provide another number.', completed: false };
      }
      data.target_business_number = text;
      data.normalized_target_business_number = normalizedTarget;
    } else {
      data[currentStep] = text;
    }

    session.data = data;
    session.step = nextStep as typeof session.step;

    if (nextStep === 'meta_signup_pending') {
      const restaurant = await RestaurantModel.create({
        ownerId: session.ownerId,
        name: String(data.restaurant_name ?? ''),
        phone: String(data.normalized_target_business_number ?? ''),
        email: String(data.email ?? ''),
        address: String(data.address ?? ''),
        description: String(data.business_description ?? ''),
        workingHours: String(data.working_hours ?? ''),
        foodCategories: String(data.food_categories ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      });

      await WhatsAppConfigModel.create({
        restaurantId: restaurant._id,
        targetBusinessNumber: String(data.target_business_number ?? ''),
        normalizedTargetBusinessNumber: String(data.normalized_target_business_number ?? ''),
        signupStatus: 'pending'
      });

      session.restaurantId = restaurant._id;
      session.status = 'awaiting_meta_signup';
      await session.save();
      return { reply: QUESTIONS.logo, completed: true, restaurantId: restaurant.id };
    }

    await session.save();
    return { reply: QUESTIONS[nextStep], completed: false };
  }
}
