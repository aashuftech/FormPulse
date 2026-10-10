import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose, { type Types } from 'mongoose';
import { env } from '../config/env.js';
import { AuthActionToken, type AuthActionPurpose } from '../models/AuthActionToken.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const BCRYPT_ROUNDS = 12;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueAuthActionToken(
  userId: Types.ObjectId,
  purpose: AuthActionPurpose,
): Promise<string> {
  const now = new Date();
  const lifetime =
    purpose === 'verify-email'
      ? env.emailVerificationExpiresInSeconds
      : env.passwordResetExpiresInSeconds;
  const token = randomBytes(32).toString('base64url');

  await AuthActionToken.updateMany({ userId, purpose, usedAt: null }, { $set: { usedAt: now } });
  await AuthActionToken.create({
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + lifetime * 1000),
  });
  return token;
}

export async function verifyEmailToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await mongoose.connection.transaction(async session => {
    const action = await AuthActionToken.findOneAndUpdate(
      {
        tokenHash,
        purpose: 'verify-email',
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { new: true, session },
    )
      .select('_id userId')
      .lean();

    if (!action) {
      throw new ApiError(400, 'Verification link is invalid or expired');
    }

    await User.updateOne(
      { _id: action.userId, emailVerified: false },
      { $set: { emailVerified: true } },
      { session },
    );
  });
}

export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  const tokenHash = hashToken(token);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await mongoose.connection.transaction(async session => {
    const now = new Date();
    const action = await AuthActionToken.findOneAndUpdate(
      {
        tokenHash,
        purpose: 'reset-password',
        usedAt: null,
        expiresAt: { $gt: now },
      },
      { $set: { usedAt: now } },
      { new: true, session },
    )
      .select('_id userId')
      .lean();

    if (!action) {
      throw new ApiError(400, 'Password reset link is invalid or expired');
    }

    const userUpdate = await User.updateOne(
      { _id: action.userId },
      { $set: { passwordHash } },
      { session },
    );
    if (userUpdate.matchedCount !== 1) {
      throw new ApiError(400, 'Password reset link is invalid or expired');
    }

    await RefreshSession.updateMany(
      { userId: action.userId, revokedAt: null },
      { $set: { revokedAt: now } },
      { session },
    );
    await AuthActionToken.updateMany(
      { userId: action.userId, purpose: 'reset-password', usedAt: null },
      { $set: { usedAt: now } },
      { session },
    );
  });
}
