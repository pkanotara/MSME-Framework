import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import './jobs/onboardingSetup.job';
import './jobs/webhookProcessing.job';

const bootstrap = async (): Promise<void> => {
  await connectDB();
  app.listen(env.PORT, () => logger.info(`Server running on port ${env.PORT}`));
};

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to bootstrap app');
  process.exit(1);
});
