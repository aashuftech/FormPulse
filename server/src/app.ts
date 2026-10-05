import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { requestGuards } from './middleware/requestGuards.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRoutes } from './routes/index.js';

export const app = express();

app.use(
  helmet({
    hsts: env.nodeEnv === 'production' ? undefined : false,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.clientUrl) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, 'Origin is not allowed'));
    },
    credentials: true,
  }),
);
app.use('/api', apiRateLimit);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(requestGuards);
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);
