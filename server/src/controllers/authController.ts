import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { authCookieOptions, refreshCookieOptions } from '../config/authCookie.js';
import { env } from '../config/env.js';
import { TARGET_GOALS, type TargetGoal } from '../models/User.js';
import {
  loginUser,
  registerUser,
  toUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  type Credentials,
} from '../services/authService.js';
import {
  listActiveSessions,
  revokeSessionByRefreshToken,
  revokeAllSessions,
  revokeSession,
  rotateRefreshToken,
} from '../services/sessionService.js';
import { ApiError } from '../utils/ApiError.js';
import {
  issueAuthActionToken,
  resetPasswordWithToken,
  verifyEmailToken,
} from '../services/authActionService.js';
import { assertEmailDeliveryConfigured, sendAuthEmail } from '../services/emailService.js';
import { User } from '../models/User.js';
import { getAuthenticatedUser } from '../middleware/authorization.js';

const paginationNumber = (maximum: number) =>
  z
    .string()
    .regex(/^\d+$/, 'Pagination values must be positive integers')
    .transform(Number)
    .pipe(z.number().int().min(1).max(maximum));
const sessionPaginationSchema = z
  .object({
    page: paginationNumber(10_000).optional(),
    limit: paginationNumber(100).optional(),
  })
  .strict()
  .transform(({ page = 1, limit = 20 }) => ({ page, limit }));

export function parseSessionPagination(query: unknown): { page: number; limit: number } {
  const pagination = sessionPaginationSchema.safeParse(query);
  if (!pagination.success) {
    const issue = pagination.error.issues[0];
    const message =
      issue?.code === 'unrecognized_keys'
        ? 'Unexpected query parameter'
        : (issue?.message ?? 'Invalid pagination parameters');
    throw new ApiError(400, message);
  }

  return pagination.data;
}

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

function getSessionMetadata(request: Request) {
  return {
    userAgent: request.get('user-agent') ?? '',
    ipAddress: request.ip ?? '',
  };
}

function setAuthCookies(
  response: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookie(env.authCookieName, tokens.accessToken, authCookieOptions);
  response.cookie(env.refreshCookieName, tokens.refreshToken, refreshCookieOptions);
}

function clearAuthCookies(response: Response): void {
  response.clearCookie(env.authCookieName, authCookieOptions);
  response.clearCookie(env.refreshCookieName, refreshCookieOptions);
}

export const register: RequestHandler = async (request, response) => {
  const input = validateRegistration(request.body);
  assertEmailDeliveryConfigured();
  const user = await registerUser(input);
  const token = await issueAuthActionToken(user._id, 'verify-email');
  await sendAuthEmail('verify-email', user.email, token);
  response.status(201).json({ message: 'Check your email for a verification link' });
};

export const verifyEmail: RequestHandler = async (request, response) => {
  const body = asObject(request.body);
  if (typeof body.token !== 'string') throw new ApiError(400, 'Invalid verification link');
  await verifyEmailToken(body.token);
  response.status(200).json({ message: 'Email verified. You can now log in.' });
};

export const resendVerification: RequestHandler = async (request, response) => {
  const body = asObject(request.body);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const user = await User.findOne({ email }).select('_id email emailVerified').lean();
  if (user && !user.emailVerified) {
    const token = await issueAuthActionToken(user._id, 'verify-email');
    await sendAuthEmail('verify-email', user.email, token).catch(() => undefined);
  }
  response.status(200).json({
    message: 'If an unverified account exists, a verification email has been sent.',
  });
};

export const forgotPassword: RequestHandler = async (request, response) => {
  const body = asObject(request.body);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const user = await User.findOne({ email }).select('_id email').lean();
  if (user) {
    const token = await issueAuthActionToken(user._id, 'reset-password');
    await sendAuthEmail('reset-password', user.email, token).catch(() => undefined);
  }
  response.status(200).json({
    message: 'If an account exists for this email, a password reset link has been sent.',
  });
};

export const resetPassword: RequestHandler = async (request, response) => {
  const body = asObject(request.body);
  if (typeof body.token !== 'string' || typeof body.password !== 'string') {
    throw new ApiError(400, 'Invalid password reset request');
  }
  await resetPasswordWithToken(body.token, body.password);
  clearAuthCookies(response);
  response.status(200).json({ message: 'Password updated. Please log in again.' });
};

export const login: RequestHandler = async (request, response) => {
  const result = await loginUser(validateCredentials(request.body), getSessionMetadata(request));
  setAuthCookies(response, result.tokens);
  response.status(200).json({ user: toUserProfile(result.user) });
};

export const refresh: RequestHandler = async (request, response) => {
  const refreshToken = request.cookies?.[env.refreshCookieName];
  if (!refreshToken || typeof refreshToken !== 'string') {
    clearAuthCookies(response);
    throw new ApiError(401, 'Invalid or expired refresh session');
  }

  try {
    const result = await rotateRefreshToken(refreshToken, getSessionMetadata(request));
    setAuthCookies(response, result.tokens);
    response.status(200).json({ user: toUserProfile(result.user) });
  } catch (error) {
    clearAuthCookies(response);
    throw error;
  }
};

export const logout: RequestHandler = async (request, response) => {
  const refreshToken = request.cookies?.[env.refreshCookieName];
  if (typeof refreshToken === 'string') {
    await revokeSessionByRefreshToken(refreshToken);
  }
  clearAuthCookies(response);
  response.status(200).json({ message: 'Logged out' });
};

export const logoutAll: RequestHandler = async (request, response) => {
  await revokeAllSessions(getAuthenticatedUser(request)._id);
  clearAuthCookies(response);
  response.status(200).json({ message: 'All sessions logged out' });
};

export const getSessions: RequestHandler = async (request, response) => {
  const { page, limit } = parseSessionPagination(request.query);
  const { sessions, hasMore } = await listActiveSessions(
    getAuthenticatedUser(request)._id,
    page,
    limit,
  );
  response.status(200).json({ sessions, page, limit, hasMore });
};

export const deleteSession: RequestHandler = async (request, response) => {
  const currentUser = getAuthenticatedUser(request);
  const sessionId = request.params.sessionId;
  if (typeof sessionId !== 'string') {
    throw new ApiError(400, 'Invalid session identifier');
  }
  await revokeSession(currentUser._id, sessionId);
  if (request.currentSessionId === sessionId) {
    clearAuthCookies(response);
  }
  response.status(200).json({ message: 'Session revoked' });
};

export const getCurrentUser: RequestHandler = (request, response, next) => {
  if (!request.currentUser) {
    next(new ApiError(401, 'Authentication required'));
    return;
  }

  response.status(200).json({ user: toUserProfile(request.currentUser) });
};

export const updateCurrentUser: RequestHandler = async (request, response) => {
  const currentUser = getAuthenticatedUser(request);
  const user = await updateUserProfile(currentUser._id, request.body);
  response.status(200).json({ user: toUserProfile(user) });
};

export const getCurrentUserSettings: RequestHandler = async (request, response) => {
  response.status(200).json({ settings: await getUserSettings(getAuthenticatedUser(request)._id) });
};

export const updateCurrentUserSettings: RequestHandler = async (request, response) => {
  response.status(200).json({
    settings: await updateUserSettings(getAuthenticatedUser(request)._id, request.body),
  });
};
