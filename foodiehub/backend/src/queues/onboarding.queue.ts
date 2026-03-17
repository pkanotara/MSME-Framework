import { Queue } from 'bullmq';
import { queueConnection } from './connection';

export const onboardingQueue = new Queue('onboarding-setup', { connection: queueConnection });
