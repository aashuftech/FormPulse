import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, type IUser, type IUserSettings, type TargetGoal } from '../models/User.js';
import type { AuthTokenPayload, UserProfileResponse } from '../types/auth.js';
import { createSession, type SessionMetadata } from './sessionService.js';
import { ApiError } from '../utils/ApiError.js';
import type { profileUpdateSchema } from '../validation/authSchemas.js';
import type { z } from 'zod';
import type { settingsUpdateSchema } from '../validation/authSchemas.js';

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const DEFAULT_USER_SETTINGS: IUserSettings = {
  voiceGuidance: true,
  vibrationAlerts: true,
  formStrictness: 'Standard',
  unitSystem: 'Metric (kg)',
  emailNotifications: true,
  theme: 'dark',
};

const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = '$2b$12$r5TSlT0Q94VU6dQgpzqkqemzZxVw9bvbtwffanwj7nkU6Aq.iuqta';

export interface Credentials {
  email: string;
  password: string;
}

export function toUserProfile(user: IUser): UserProfileResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    athleteLevel: user.athleteLevel,
    experienceYears: user.experienceYears,
    targetGoal: user.targetGoal,
    role: user.role,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    joinedDate: user.joinedDate.toISOString(),
    streakDays: user.streakDays,
    weeklyProgressScore: user.weeklyProgressScore,
  };
}

export async function registerUser(input: Credentials & { name: string; targetGoal: TargetGoal }) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    targetGoal: input.targetGoal,
    emailVerified: false,
  });

  return user;
}

export async function loginUser(input: Credentials, metadata: SessionMetadata) {
  const user = await User.findOne({ email: input.email }).select(
    '+passwordHash name email emailVerified role athleteLevel experienceYears targetGoal weightKg heightCm joinedDate streakDays weeklyProgressScore',
  );
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new ApiError(403, 'Verify your email address before logging in');
  }

  return { user, tokens: await createSession(user, metadata) };
}

export async function getUserById(id: string): Promise<IUser> {
  const user = await User.findById(id).select(
    'name email role athleteLevel experienceYears targetGoal weightKg heightCm joinedDate streakDays weeklyProgressScore',
  );

  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  return user;
}

export async function updateUserProfile(
  userId: mongoose.Types.ObjectId,
  updates: ProfileUpdateInput,
): Promise<IUser> {
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $set: updates },
    { new: true, runValidators: true },
  ).select(
    'name email role athleteLevel experienceYears targetGoal weightKg heightCm joinedDate streakDays weeklyProgressScore',
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function getUserSettings(userId: mongoose.Types.ObjectId): Promise<IUserSettings> {
  const user = await User.findById(userId).select('settings').lean();
  if (!user) throw new ApiError(404, 'User not found');
  return { ...DEFAULT_USER_SETTINGS, ...user.settings };
}

export async function updateUserSettings(
  userId: mongoose.Types.ObjectId,
  updates: SettingsUpdateInput,
): Promise<IUserSettings> {
  const setFields = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [`settings.${key}`, value]),
  );
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $set: setFields },
    { new: true, runValidators: true },
  )
    .select('settings')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');
  return { ...DEFAULT_USER_SETTINGS, ...user.settings };
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.sid !== 'string' ||
      !/^[a-f\d]{24}$/i.test(decoded.sub) ||
      !mongoose.isValidObjectId(decoded.sub) ||
      !/^[a-f\d]{24}$/i.test(decoded.sid) ||
      !mongoose.isValidObjectId(decoded.sid)
    ) {
      throw new ApiError(401, 'Invalid authentication token');
    }
    return { sub: decoded.sub, sid: decoded.sid };
  } catch {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }
}
