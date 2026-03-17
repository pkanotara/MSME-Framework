import { Request, Response } from 'express';
import { WebhookEventLogModel } from '../models/WebhookEventLog';

export const listWebhookLogs = async (_req: Request, res: Response): Promise<void> => {
  const logs = await WebhookEventLogModel.find().sort({ createdAt: -1 }).limit(200);
  res.json(logs);
};
