import { Request, Response } from 'express';
import { AuthRequest } from '../types/express';
import { OnboardingService } from '../services/OnboardingService';
import { OnboardingSessionModel } from '../models/OnboardingSession';
import { ApiError } from '../utils/apiError';
import { OnboardingChatService } from '../services/OnboardingChatService';
import { EmbeddedSignupService } from '../services/EmbeddedSignupService';

const onboardingService = new OnboardingService();
const onboardingChatService = new OnboardingChatService();
const embeddedSignupService = new EmbeddedSignupService();

export const startOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await onboardingService.start(req.user!.id);
  res.status(201).json(session);
};

export const submitOnboardingDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await onboardingService.submitDetails(req.params.id, req.body, req.user!.id);
  if (!session) throw new ApiError(404, 'Session not found');
  res.json(session);
};

export const getOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await OnboardingSessionModel.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');
  res.json(session);
};

export const onboardingByWhatsApp = async (req: Request, res: Response): Promise<void> => {
  const { from, message } = req.body as { from: string; message: string };
  if (!from || !message) throw new ApiError(400, 'from and message are required');

  const result = await onboardingChatService.processIncomingMessage(from, message);

  if (result.completed && result.restaurantId) {
    const signupLink = embeddedSignupService.getSignupLink(result.restaurantId);
    res.json({ reply: `${result.reply}\nComplete signup: ${signupLink}`, status: 'awaiting_meta_signup' });
    return;
  }

  res.json({ reply: result.reply, status: 'in_progress' });
};
