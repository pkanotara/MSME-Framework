import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { EmbeddedSignupService } from '../services/EmbeddedSignupService';
import { MetaAuthService } from '../services/MetaAuthService';
import { onboardingQueue } from '../queues/onboarding.queue';
import { env } from '../config/env';
import { WebhookEventLogModel } from '../models/WebhookEventLog';
import { webhookQueue } from '../queues/webhook.queue';
import { ApiError } from '../utils/apiError';
import { OnboardingSessionModel } from '../models/OnboardingSession';
import { WhatsAppConfigModel } from '../models/WhatsAppConfig';
import { RestaurantModel } from '../models/Restaurant';

const embeddedSignupService = new EmbeddedSignupService();
const metaAuthService = new MetaAuthService();

const isSignatureValid = (payload: object, signature?: string): boolean => {
  if (!env.META_APP_SECRET || !signature?.startsWith('sha256=')) return false;
  const digest = createHmac('sha256', env.META_APP_SECRET).update(JSON.stringify(payload)).digest('hex');
  const expected = Buffer.from(`sha256=${digest}`);
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export const getEmbeddedSignupLink = async (req: Request, res: Response): Promise<void> => {
  const url = embeddedSignupService.getSignupLink(req.params.restaurantId);
  res.json({ url });
};

export const metaCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, restaurantId, wabaId, phoneNumberId, businessAccountId } = req.query as Record<string, string>;
  if (!code || !restaurantId) throw new ApiError(400, 'code and restaurantId are required');

  const token = await metaAuthService.exchangeCodeForToken(code);

  await WhatsAppConfigModel.findOneAndUpdate(
    { restaurantId },
    {
      wabaId,
      phoneNumberId,
      businessAccountId,
      accessToken: token.access_token,
      signupStatus: 'completed',
      botStatus: 'active'
    },
    { upsert: false }
  );

  await RestaurantModel.findByIdAndUpdate(restaurantId, { onboardingStatus: 'active' });
  await OnboardingSessionModel.findOneAndUpdate({ restaurantId }, { status: 'active', step: 'completed' });

  if (wabaId) {
    await onboardingQueue.add(
      'setup',
      { wabaId, accessToken: token.access_token },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } }
    );
  }

  res.json({ success: true, signupStatus: 'completed' });
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
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (env.META_APP_SECRET && !isSignatureValid(req.body, signature)) {
    throw new ApiError(401, 'Invalid webhook signature');
  }

  const log = await WebhookEventLogModel.create({
    eventType: req.body?.entry?.[0]?.changes?.[0]?.field ?? 'unknown',
    payload: req.body,
    processed: false
  });

  await webhookQueue.add('process', { logId: log.id }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });
  res.sendStatus(200);
};

export const retryMetaSetup = async (req: Request, res: Response): Promise<void> => {
  const conn = await WhatsAppConfigModel.findOne({ restaurantId: req.params.restaurantId });
  if (!conn?.accessToken || !conn.wabaId) {
    res.status(404).json({ message: 'Meta connection not found' });
    return;
  }

  await onboardingQueue.add('retry-setup', {
    wabaId: conn.wabaId,
    accessToken: conn.accessToken
  });
  res.json({ queued: true });
};
