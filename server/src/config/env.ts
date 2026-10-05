import 'dotenv/config';

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: getRequiredEnv('MONGODB_URI'),
  clientUrl: getRequiredEnv('CLIENT_URL', 'http://localhost:5173'),
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 604800),
  authCookieName: getRequiredEnv('AUTH_COOKIE_NAME', 'formpulse_token'),
  cookieSameSite: getRequiredEnv('COOKIE_SAME_SITE', 'lax'),
};

let configuredClientOrigin: URL;
try {
  configuredClientOrigin = new URL(env.clientUrl);
} catch {
  throw new Error('CLIENT_URL must be a valid frontend origin');
}

if (
  !['http:', 'https:'].includes(configuredClientOrigin.protocol) ||
  configuredClientOrigin.origin !== env.clientUrl
) {
  throw new Error('CLIENT_URL must be an exact HTTP or HTTPS origin');
}

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

if (env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

if (!Number.isInteger(env.jwtExpiresInSeconds) || env.jwtExpiresInSeconds < 1) {
  throw new Error('JWT_EXPIRES_IN_SECONDS must be a positive integer');
}

if (!['strict', 'lax', 'none'].includes(env.cookieSameSite)) {
  throw new Error('COOKIE_SAME_SITE must be strict, lax, or none');
}
