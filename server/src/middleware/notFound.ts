import type { RequestHandler } from 'express';

export const notFound: RequestHandler = (request, response, next) => {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`);
  response.status(404);
  next(error);
};
