import type { RequestHandler } from 'express';
import mongoose from 'mongoose';

export const getHealth: RequestHandler = (_request, response) => {
  response.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};
