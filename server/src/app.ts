import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { requestGuards } from './middleware/requestGuards.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRoutes } from './routes/index.js';

export const app = express();

app.set('trust proxy', env.trustProxyHops);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'connect-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://storage.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'script-src': ["'self'", "'wasm-unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
    hsts: env.nodeEnv === 'production' ? undefined : false,
  }),
);
app.use(
  '/api',
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

if (env.nodeEnv === 'production') {
  const frontendDist = fileURLToPath(new URL('../../dist/', import.meta.url));
  const frontendIndex = fileURLToPath(new URL('../../dist/index.html', import.meta.url));

  app.use(express.static(frontendDist, { index: false }));
  app.use((request, response, next) => {
    if (
      request.method !== 'GET' ||
      request.path === '/api' ||
      request.path.startsWith('/api/') ||
      !request.accepts('html')
    ) {
      next();
      return;
    }

    response.sendFile(frontendIndex, error => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);
