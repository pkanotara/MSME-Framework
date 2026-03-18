import { onboardingQueue } from '../queues/onboarding.queue';
import { MetaSetupService } from '../services/MetaSetupService';

const metaSetupService = new MetaSetupService();

onboardingQueue.registerHandler(async ({ wabaId, accessToken }) => {
  await metaSetupService.subscribeWebhook(wabaId, accessToken);
});
