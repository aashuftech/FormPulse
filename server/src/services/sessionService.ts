import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { env } from '../config/env.js';
import { RefreshSession, type IRefreshSession } from '../models/RefreshSession.js';
import { User, type IUser } from '../models/User.js';
import type { AuthTokenPayload } from '../types/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { getOwnedResourceFilter } from '../middleware/authorization.js';

export interface SessionMetadata {
  userAgent: string;
  ipAddress: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function createRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

function createAccessToken(userId: string, sessionId: string): string {
  const payload: AuthTokenPayload = { sub: userId, sid: sessionId };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenExpiresInSeconds });
}

function sessionExpiresAt(): Date {
  return new Date(Date.now() + env.refreshTokenExpiresInSeconds * 1000);
}

function metadataFields(metadata: SessionMetadata) {
  return {
    userAgent: metadata.userAgent.slice(0, 512),
    ipAddress: metadata.ipAddress.slice(0, 128),
  };
}

function issueTokens(userId: string, sessionId: string, refreshToken: string): IssuedTokens {
  return {
    accessToken: createAccessToken(userId, sessionId),
    refreshToken,
    sessionId,
  };
}

export async function createSession(user: IUser, metadata: SessionMetadata): Promise<IssuedTokens> {
  const refreshToken = createRefreshToken();
  const session = await RefreshSession.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: sessionExpiresAt(),
    ...metadataFields(metadata),
  });

  return issueTokens(user._id.toString(), session._id.toString(), refreshToken);
}

export async function rotateRefreshToken(
  token: string,
  metadata: SessionMetadata,
): Promise<{ user: IUser; tokens: IssuedTokens }> {
  const currentHash = hashToken(token);
  const nextRefreshToken = createRefreshToken();
  const now = new Date();
  const session = await RefreshSession.findOneAndUpdate(
    { tokenHash: currentHash, revokedAt: null, expiresAt: { $gt: now } },
    {
      $set: {
        tokenHash: hashToken(nextRefreshToken),
        lastUsedAt: now,
        ...metadataFields(metadata),
      },
      $addToSet: { rotatedTokenHashes: currentHash },
    },
    { new: true, runValidators: true },
  )
    .select('_id userId')
    .lean();

  if (!session) {
    const reusedSession = await RefreshSession.findOne({ rotatedTokenHashes: currentHash })
      .select('_id revokedAt')
      .lean();
    if (reusedSession?.revokedAt === null) {
      await RefreshSession.updateOne(
        { _id: reusedSession._id, revokedAt: null },
        { $set: { revokedAt: now } },
      );
    }
    throw new ApiError(401, 'Invalid or expired refresh session');
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await RefreshSession.updateOne({ _id: session._id }, { $set: { revokedAt: now } });
    throw new ApiError(401, 'Authentication required');
  }

  return {
    user,
    tokens: issueTokens(user._id.toString(), session._id.toString(), nextRefreshToken),
  };
}

export async function isActiveSession(sessionId: string, userId: Types.ObjectId): Promise<boolean> {
  return Boolean(
    await RefreshSession.exists({
      _id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
  );
}

export async function revokeSessionByRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await RefreshSession.updateOne(
    {
      revokedAt: null,
      $or: [{ tokenHash }, { rotatedTokenHashes: tokenHash }],
    },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllSessions(userId: Types.ObjectId): Promise<void> {
  await RefreshSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function listActiveSessions(userId: Types.ObjectId, page: number, limit: number) {
  const pageSessions = await RefreshSession.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select('_id createdAt lastUsedAt expiresAt userAgent ipAddress')
    .sort({ lastUsedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit + 1)
    .lean();

  const hasMore = pageSessions.length > limit;
  const sessions = pageSessions.slice(0, limit).map(session => ({
    sessionId: session._id.toString(),
    createdAt: session.createdAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
  }));

  return { sessions, hasMore };
}

export async function revokeSession(
  userId: Types.ObjectId,
  sessionId: string,
): Promise<IRefreshSession> {
  const ownershipFilter = getOwnedResourceFilter(sessionId, userId);
  const session = await RefreshSession.findOneAndUpdate(
    { ...ownershipFilter, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  return session;
}
