import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import router from './routes';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
  })
);
app.use(express.json());
app.use('/api', router);
app.use(errorHandler);
