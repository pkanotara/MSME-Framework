import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { OnboardingService } from '../services/OnboardingService';
import { OnboardingSessionModel } from '../models/OnboardingSession';
import { ApiError } from '../utils/apiError';

const onboardingService = new OnboardingService();

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
