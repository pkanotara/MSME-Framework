import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerAdminSchema } from '../validators/auth.validator';
import { login, registerAdmin } from '../controllers/auth.controller';

const router = Router();

router.post('/login', validateRequest(loginSchema), asyncHandler(login));
router.post('/register-admin', validateRequest(registerAdminSchema), asyncHandler(registerAdmin));

export default router;
