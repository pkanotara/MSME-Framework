import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { listWebhookLogs } from '../controllers/logs.controller';

const router = Router();

router.get('/webhooks', asyncHandler(listWebhookLogs));

export default router;
