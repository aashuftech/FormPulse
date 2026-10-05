import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';

function containsUnsafeMongoKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsUnsafeMongoKey);
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return Object.entries(value).some(([key, nestedValue]) => {
    const unsafeKey =
      key.startsWith('$') ||
      key.includes('.') ||
      ['__proto__', 'prototype', 'constructor'].includes(key);
    return unsafeKey || containsUnsafeMongoKey(nestedValue);
  });
}

function containsRepeatedQueryValues(value: unknown): boolean {
  if (Array.isArray(value)) {
    return true;
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return Object.values(value).some(containsRepeatedQueryValues);
}

export const requestGuards: RequestHandler = (request, _response, next) => {
  if (containsRepeatedQueryValues(request.query)) {
    next(new ApiError(400, 'Repeated query parameters are not allowed'));
    return;
  }

  if (
    containsUnsafeMongoKey(request.body) ||
    containsUnsafeMongoKey(request.params) ||
    containsUnsafeMongoKey(request.query)
  ) {
    next(new ApiError(400, 'Request contains an invalid field'));
    return;
  }

  next();
};
