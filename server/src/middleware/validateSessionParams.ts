import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const sessionParamsSchema = z.object({
  sessionId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid session identifier'),
});

export const validateSessionParams: RequestHandler = (request, _response, next) => {
  const result = sessionParamsSchema.safeParse(request.params);
  if (!result.success) {
    next(new ApiError(400, result.error.issues[0]?.message ?? 'Invalid session identifier'));
    return;
  }

  next();
};
