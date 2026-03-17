import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { listWebhookLogs } from '../controllers/logs.controller';
import { authGuard, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/webhooks', authGuard, requireRoles('super_admin'), asyncHandler(listWebhookLogs));

export default router;
