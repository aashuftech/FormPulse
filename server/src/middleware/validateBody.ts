import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validateBody(schema: z.ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const issue = result.error.issues[0];
      const message =
        issue?.code === 'unrecognized_keys'
          ? 'Unexpected field in request body'
          : (issue?.message ?? 'Invalid request body');
      next(new ApiError(400, message));
      return;
    }

    request.body = result.data;
    next();
  };
}
