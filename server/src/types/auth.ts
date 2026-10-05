import type { IUser } from '../models/User.js';

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
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
}
