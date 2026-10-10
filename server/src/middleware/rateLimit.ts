import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

function createLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new ApiError(429, 'Too many requests. Please try again later.'));
    },
  });
}

export const apiRateLimit = createLimiter(15 * 60 * 1000, 300);
export const loginRateLimit = createLimiter(15 * 60 * 1000, 10);
export const registerRateLimit = createLimiter(60 * 60 * 1000, 5);
export const verifyEmailRateLimit = createLimiter(15 * 60 * 1000, 10);
export const resendVerificationRateLimit = createLimiter(60 * 60 * 1000, 5);
export const forgotPasswordRateLimit = createLimiter(60 * 60 * 1000, 5);
export const resetPasswordRateLimit = createLimiter(15 * 60 * 1000, 10);
