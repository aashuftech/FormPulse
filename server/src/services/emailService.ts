import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

type AuthEmailKind = 'verify-email' | 'reset-password';

type MailTransport = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransport | undefined;

export function assertEmailDeliveryConfigured(): void {
  if (!env.smtpHost || !env.emailFrom) {
    throw new ApiError(503, 'Email delivery is temporarily unavailable');
  }
  if (Boolean(env.smtpUser) !== Boolean(env.smtpPassword)) {
    throw new ApiError(503, 'Email delivery is temporarily unavailable');
  }
}

function getTransporter(): MailTransport {
  assertEmailDeliveryConfigured();
  transporter ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    ...(env.smtpUser ? { auth: { user: env.smtpUser, pass: env.smtpPassword } } : {}),
  });
  return transporter;
}

export async function sendAuthEmail(
  kind: AuthEmailKind,
  email: string,
  token: string,
): Promise<void> {
  const path = kind === 'verify-email' ? '/verify-email' : '/reset-password';
  const subject =
    kind === 'verify-email' ? 'Verify your FormPulse email' : 'Reset your FormPulse password';
  const url = new URL(path, env.clientUrl);
  url.searchParams.set('token', token);
  const action = kind === 'verify-email' ? 'verify your email address' : 'reset your password';
  const lifetime =
    kind === 'verify-email'
      ? env.emailVerificationExpiresInSeconds
      : env.passwordResetExpiresInSeconds;
  const expiry =
    lifetime % 86400 === 0
      ? `${lifetime / 86400} days`
      : lifetime % 3600 === 0
        ? `${lifetime / 3600} hours`
        : lifetime % 60 === 0
          ? `${lifetime / 60} minutes`
          : `${lifetime} seconds`;

  try {
    await getTransporter().sendMail({
      from: env.emailFrom,
      to: email,
      subject,
      text: `Use this link to ${action}: ${url.toString()}\nThis link expires in ${expiry}.`,
      html: `<p>Use this link to ${action}:</p><p><a href="${url.toString()}">${url.toString()}</a></p><p>This link expires in ${expiry}.</p>`,
    });
  } catch {
    throw new ApiError(503, 'Email delivery is temporarily unavailable');
  }
}
