import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { getEmbeddedSignupLink, metaCallback, receiveWebhook, retryMetaSetup, verifyWebhook } from '../controllers/meta.controller';

const router = Router();

router.get('/embedded-signup-link/:restaurantId', asyncHandler(getEmbeddedSignupLink));
router.get('/callback', asyncHandler(metaCallback));
router.get('/webhook', asyncHandler(verifyWebhook));
router.post('/webhook', asyncHandler(receiveWebhook));
router.post('/setup/retry/:restaurantId', asyncHandler(retryMetaSetup));

export default router;
