import type { CookieOptions } from 'express';
import { env } from './env.js';

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: env.cookieSameSite as CookieOptions['sameSite'],
  path: '/',
  maxAge: env.jwtExpiresInSeconds * 1000,
};
