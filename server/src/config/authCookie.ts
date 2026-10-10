import type { CookieOptions } from 'express';
import { env } from './env.js';

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production' || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite as CookieOptions['sameSite'],
  path: '/',
  maxAge: env.accessTokenExpiresInSeconds * 1000,
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production' || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite as CookieOptions['sameSite'],
  path: '/api/auth',
  maxAge: env.refreshTokenExpiresInSeconds * 1000,
};
