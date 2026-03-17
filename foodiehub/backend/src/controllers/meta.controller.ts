import { Request, Response } from 'express';
import { EmbeddedSignupService } from '../services/EmbeddedSignupService';
import { MetaAuthService } from '../services/MetaAuthService';
import { MetaConnectionModel } from '../models/MetaConnection';
import { onboardingQueue } from '../queues/onboarding.queue';
import { env } from '../config/env';
import { WebhookEventLogModel } from '../models/WebhookEventLog';
import { webhookQueue } from '../queues/webhook.queue';

const embeddedSignupService = new EmbeddedSignupService();
const metaAuthService = new MetaAuthService();

export const getEmbeddedSignupLink = async (req: Request, res: Response): Promise<void> => {
  const url = embeddedSignupService.getSignupLink(req.params.restaurantId);
  res.json({ url });
};

export const metaCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, restaurantId, wabaId, phoneNumberId } = req.query as Record<string, string>;
  const token = await metaAuthService.exchangeCodeForToken(code);

  await MetaConnectionModel.findOneAndUpdate(
    { restaurantId },
    {
      restaurantId,
      wabaId,
      phoneNumberId,
      permanentAccessToken: token.access_token,
      status: 'connected'
    },
    { upsert: true }
  );

  await onboardingQueue.add(
    'setup',
    { wabaId, accessToken: token.access_token },
    { attempts: 3, backoff: { type: 'exponential', delay: 3000 } }
  );

  res.json({ success: true });
};

export const verifyWebhook = async (req: Request, res: Response): Promise<void> => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }
  res.status(403).send('Forbidden');
};

export const receiveWebhook = async (req: Request, res: Response): Promise<void> => {
  const log = await WebhookEventLogModel.create({
    eventType: req.body?.entry?.[0]?.changes?.[0]?.field ?? 'unknown',
    payload: req.body,
    processed: false
  });

  await webhookQueue.add('process', { logId: log.id }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });
  res.sendStatus(200);
};

export const retryMetaSetup = async (req: Request, res: Response): Promise<void> => {
  const conn = await MetaConnectionModel.findOne({ restaurantId: req.params.restaurantId });
  if (!conn?.permanentAccessToken) {
    res.status(404).json({ message: 'Meta connection not found' });
    return;
  }

  await onboardingQueue.add('retry-setup', {
    wabaId: conn.wabaId,
    accessToken: conn.permanentAccessToken
  });
  res.json({ queued: true });
};
