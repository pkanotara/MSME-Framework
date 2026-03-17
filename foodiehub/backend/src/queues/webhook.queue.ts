import { Queue } from 'bullmq';
import { queueConnection } from './connection';

export const webhookQueue = new Queue('webhook-processing', { connection: queueConnection });
