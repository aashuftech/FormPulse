import type { IUser } from '../models/User.js';

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  role: IUser['role'];
  athleteLevel: IUser['athleteLevel'];
  experienceYears: number;
  targetGoal: IUser['targetGoal'];
  weightKg: number;
  heightCm: number;
  joinedDate: string;
  streakDays: number;
  weeklyProgressScore: number;
}

export interface AuthTokenPayload {
  sub: string;
  sid: string;
}
