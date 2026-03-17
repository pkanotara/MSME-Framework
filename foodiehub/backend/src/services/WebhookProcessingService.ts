import { WebhookEventLogModel } from '../models/WebhookEventLog';

export class WebhookProcessingService {
  async process(logId: string): Promise<void> {
    const log = await WebhookEventLogModel.findById(logId);
    if (!log) return;

    log.processed = true;
    log.processingError = undefined;
    await log.save();
  }
}
