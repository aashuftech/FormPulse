import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { getUserById, verifyToken } from '../services/authService.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate: RequestHandler = async (request, _response, next) => {
  const token = request.cookies?.[env.authCookieName];

  if (!token || typeof token !== 'string') {
    throw new ApiError(401, 'Authentication required');
  }

  const userId = verifyToken(token);
  request.currentUser = await getUserById(userId);
  next();
};
