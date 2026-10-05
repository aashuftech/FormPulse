import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRoutes } from './routes/index.js';

export const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);
