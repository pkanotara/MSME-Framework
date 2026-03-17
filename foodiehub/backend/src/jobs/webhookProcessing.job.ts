import { Worker } from 'bullmq';
import { queueConnection } from '../queues/connection';
import { WebhookProcessingService } from '../services/WebhookProcessingService';

const webhookProcessingService = new WebhookProcessingService();

export const webhookWorker = new Worker(
  'webhook-processing',
  async (job) => {
    await webhookProcessingService.process(job.data.logId as string);
  },
  {
    connection: queueConnection,
    settings: {
      backoffStrategy: () => 3000
    }
  }
);
