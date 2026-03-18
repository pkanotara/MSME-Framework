import { Router } from 'express';
import { uploadImageByUrl } from '../controllers/upload.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authGuard } from '../middleware/auth';

const router = Router();

router.post('/image-url', authGuard, asyncHandler(uploadImageByUrl));

export default router;
