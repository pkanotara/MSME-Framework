import { InMemoryQueue } from './base.queue';

export interface WebhookProcessingJobPayload {
  logId: string;
}

export const webhookQueue = new InMemoryQueue<WebhookProcessingJobPayload>('webhook-processing');
