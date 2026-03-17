import { Worker } from 'bullmq';
import { queueConnection } from '../queues/connection';
import { MetaSetupService } from '../services/MetaSetupService';

const metaSetupService = new MetaSetupService();

export const onboardingSetupWorker = new Worker(
  'onboarding-setup',
  async (job) => {
    const { wabaId, accessToken } = job.data as { wabaId: string; accessToken: string };
    await metaSetupService.subscribeWebhook(wabaId, accessToken);
  },
  { connection: queueConnection }
);
