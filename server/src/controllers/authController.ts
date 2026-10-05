import type { RequestHandler } from 'express';
import { authCookieOptions } from '../config/authCookie.js';
import { env } from '../config/env.js';
import { TARGET_GOALS, type TargetGoal } from '../models/User.js';
import {
  loginUser,
  registerUser,
  toUserProfile,
  type Credentials,
} from '../services/authService.js';
import { ApiError } from '../utils/ApiError.js';

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError(400, 'Request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

function validateCredentials(value: unknown): Credentials {
  const body = asObject(value);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address');
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ApiError(400, 'Password must be at least 8 characters and at most 72 bytes');
  }

  return { email, password };
}

function validateRegistration(value: unknown) {
  const body = asObject(value);
  const credentials = validateCredentials(body);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const targetGoal = body.targetGoal ?? 'Build Muscle';

  if (name.length < 2 || name.length > 100) {
    throw new ApiError(400, 'Name must be between 2 and 100 characters');
  }
  if (typeof targetGoal !== 'string' || !TARGET_GOALS.includes(targetGoal as TargetGoal)) {
    throw new ApiError(400, 'Choose a valid fitness goal');
  }

  return { ...credentials, name, targetGoal: targetGoal as TargetGoal };
}

function setAuthCookie(response: Parameters<RequestHandler>[1], token: string): void {
  response.cookie(env.authCookieName, token, authCookieOptions);
}

export const register: RequestHandler = async (request, response) => {
  const result = await registerUser(validateRegistration(request.body));
  setAuthCookie(response, result.token);
  response.status(201).json({ user: toUserProfile(result.user) });
};

export const login: RequestHandler = async (request, response) => {
  const result = await loginUser(validateCredentials(request.body));
  setAuthCookie(response, result.token);
  response.status(200).json({ user: toUserProfile(result.user) });
};

export const logout: RequestHandler = (_request, response) => {
  response.clearCookie(env.authCookieName, authCookieOptions);
  response.status(200).json({ message: 'Logged out' });
};

export const getCurrentUser: RequestHandler = (request, response, next) => {
  if (!request.currentUser) {
    next(new ApiError(401, 'Authentication required'));
    return;
  }

  response.status(200).json({ user: toUserProfile(request.currentUser) });
};

