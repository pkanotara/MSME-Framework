import { InMemoryQueue } from './base.queue';

export interface OnboardingSetupJobPayload {
  wabaId: string;
  accessToken: string;
}

export const onboardingQueue = new InMemoryQueue<OnboardingSetupJobPayload>('onboarding-setup');
