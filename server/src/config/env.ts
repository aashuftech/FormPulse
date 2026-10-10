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
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 0),
  mongoUri: getRequiredEnv('MONGODB_URI'),
  clientUrl: getRequiredEnv('CLIENT_URL', 'http://localhost:5173'),
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  accessTokenExpiresInSeconds: Number(process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS ?? 900),
  refreshTokenExpiresInSeconds: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 2592000),
  authCookieName: getRequiredEnv('AUTH_COOKIE_NAME', 'formpulse_token'),
  refreshCookieName: getRequiredEnv('REFRESH_COOKIE_NAME', 'formpulse_refresh'),
  cookieSameSite: getRequiredEnv('COOKIE_SAME_SITE', 'lax'),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
  emailVerificationExpiresInSeconds: Number(
    process.env.EMAIL_VERIFICATION_EXPIRES_IN_SECONDS ?? 86400,
  ),
  passwordResetExpiresInSeconds: Number(process.env.PASSWORD_RESET_EXPIRES_IN_SECONDS ?? 1800),
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

if (!Number.isInteger(env.trustProxyHops) || env.trustProxyHops < 0 || env.trustProxyHops > 5) {
  throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5');
}

if (env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

if (
  !Number.isInteger(env.accessTokenExpiresInSeconds) ||
  env.accessTokenExpiresInSeconds < 1 ||
  env.accessTokenExpiresInSeconds > 3600
) {
  throw new Error('ACCESS_TOKEN_EXPIRES_IN_SECONDS must be between 1 and 3600');
}

if (
  !Number.isInteger(env.refreshTokenExpiresInSeconds) ||
  env.refreshTokenExpiresInSeconds <= env.accessTokenExpiresInSeconds
) {
  throw new Error(
    'REFRESH_TOKEN_EXPIRES_IN_SECONDS must be greater than ACCESS_TOKEN_EXPIRES_IN_SECONDS',
  );
}

if (!['strict', 'lax', 'none'].includes(env.cookieSameSite)) {
  throw new Error('COOKIE_SAME_SITE must be strict, lax, or none');
}

if (!Number.isInteger(env.smtpPort) || env.smtpPort < 1 || env.smtpPort > 65535) {
  throw new Error('SMTP_PORT must be an integer between 1 and 65535');
}

if (
  !Number.isInteger(env.emailVerificationExpiresInSeconds) ||
  env.emailVerificationExpiresInSeconds < 300 ||
  env.emailVerificationExpiresInSeconds > 7 * 24 * 60 * 60
) {
  throw new Error('EMAIL_VERIFICATION_EXPIRES_IN_SECONDS must be between 300 and 604800');
}

if (
  !Number.isInteger(env.passwordResetExpiresInSeconds) ||
  env.passwordResetExpiresInSeconds < 60 ||
  env.passwordResetExpiresInSeconds > 60 * 60
) {
  throw new Error('PASSWORD_RESET_EXPIRES_IN_SECONDS must be between 60 and 3600');
}
