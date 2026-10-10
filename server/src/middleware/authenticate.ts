import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { getUserById, verifyToken } from '../services/authService.js';
import { isActiveSession } from '../services/sessionService.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate: RequestHandler = async (request, _response, next) => {
  const token = request.cookies?.[env.authCookieName];

  if (!token || typeof token !== 'string') {
    throw new ApiError(401, 'Authentication required');
  }

  const { sub, sid } = verifyToken(token);
  const user = await getUserById(sub);
  if (!(await isActiveSession(sid, user._id))) {
    throw new ApiError(401, 'Authentication required');
  }
  request.currentUser = user;
  request.currentSessionId = sid;
  next();
};
