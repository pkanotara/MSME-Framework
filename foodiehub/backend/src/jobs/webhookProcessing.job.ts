import { webhookQueue } from '../queues/webhook.queue';
import { WebhookProcessingService } from '../services/WebhookProcessingService';

const webhookProcessingService = new WebhookProcessingService();

webhookQueue.registerHandler(async ({ logId }) => {
  await webhookProcessingService.process(logId);
});
