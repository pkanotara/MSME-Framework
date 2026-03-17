import { Router } from 'express';
import { authGuard } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { getOnboarding, startOnboarding, submitOnboardingDetails } from '../controllers/onboarding.controller';
import { validateRequest } from '../middleware/validateRequest';
import { onboardingDetailsSchema, onboardingStartSchema } from '../validators/onboarding.validator';

const router = Router();

router.post('/start', authGuard, validateRequest(onboardingStartSchema), asyncHandler(startOnboarding));
router.post('/:id/details', authGuard, validateRequest(onboardingDetailsSchema), asyncHandler(submitOnboardingDetails));
router.get('/:id', authGuard, asyncHandler(getOnboarding));

export default router;
