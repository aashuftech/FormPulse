import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDuplicateEmailError(error: unknown): boolean {
  if (!isRecord(error) || error.code !== 11000 || !isRecord(error.keyPattern)) {
    return false;
  }

  return Object.hasOwn(error.keyPattern, 'email');
}

function isDatabaseError(error: unknown): boolean {
  if (error instanceof mongoose.Error) {
    return true;
  }

  return isRecord(error) && typeof error.name === 'string' && /^(Mongo|Mongoose)/.test(error.name);
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  let statusCode = error instanceof ApiError ? error.statusCode : response.statusCode;
  if (statusCode < 400) statusCode = 500;
  let message =
    error instanceof ApiError && error.statusCode < 500 ? error.message : 'Internal server error';

  if (
    error instanceof ApiError &&
    error.statusCode === 503 &&
    error.message === 'Email delivery is temporarily unavailable'
  ) {
    message = error.message;
  }

  if (isDuplicateEmailError(error)) {
    statusCode = 409;
    message = 'An account with this email already exists.';
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Invalid data';
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid identifier';
  } else if (typeof error === 'object' && error !== null && 'status' in error) {
    const errorStatus = error.status;
    if (typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus < 500) {
      statusCode = errorStatus;
      if (errorStatus === 400) message = 'Invalid request body';
      if (errorStatus === 413) message = 'Request body too large';
      if (errorStatus === 415) message = 'Unsupported request content type';
    }
  }

  const exposeDevelopmentDetails =
    env.nodeEnv === 'development' &&
    error instanceof Error &&
    !(error instanceof ApiError) &&
    !isDatabaseError(error);

  if (exposeDevelopmentDetails) {
    message = error.message;
  } else if (statusCode === 404) {
    message = 'Route not found';
  }

  response.status(statusCode).json({
    status: 'error',
    message,
    ...(exposeDevelopmentDetails ? { stack: error.stack } : {}),
  });
};
