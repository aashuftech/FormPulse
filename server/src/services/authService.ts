import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, type IUser, type TargetGoal } from '../models/User.js';
import type { AuthTokenPayload, UserProfileResponse } from '../types/auth.js';
import { ApiError } from '../utils/ApiError.js';

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
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    joinedDate: user.joinedDate.toISOString(),
    streakDays: user.streakDays,
    weeklyProgressScore: user.weeklyProgressScore,
  };
}

function createToken(user: IUser): string {
  const payload: AuthTokenPayload = { sub: user._id.toString() };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresInSeconds });
}

export async function registerUser(input: Credentials & { name: string; targetGoal: TargetGoal }) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    targetGoal: input.targetGoal,
  });

  return { user, token: createToken(user) };
}

export async function loginUser(input: Credentials) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return { user, token: createToken(user) };
}

export async function getUserById(id: string): Promise<IUser> {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  return user;
}

export function verifyToken(token: string): string {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      !/^[a-f\d]{24}$/i.test(decoded.sub) ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      throw new ApiError(401, 'Invalid authentication token');
    }
    return decoded.sub;
  } catch {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }
}
