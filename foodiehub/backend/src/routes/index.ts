import { Router } from 'express';
import authRoutes from './auth.routes';
import onboardingRoutes from './onboarding.routes';
import metaRoutes from './meta.routes';
import restaurantsRoutes from './restaurants.routes';
import menuRoutes from './menu.routes';
import ordersRoutes from './orders.routes';
import logsRoutes from './logs.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/meta', metaRoutes);
router.use('/restaurants', restaurantsRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', ordersRoutes);
router.use('/logs', logsRoutes);

export default router;
