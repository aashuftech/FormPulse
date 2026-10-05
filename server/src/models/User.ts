import { model, Schema, type Document } from 'mongoose';

export const TARGET_GOALS = [
  'Build Muscle',
  'Build Strength',
  'Increase Endurance',
  'Lose Fat',
  'Improve Mobility',
] as const;

export type TargetGoal = (typeof TARGET_GOALS)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  athleteLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  experienceYears: number;
  targetGoal: TargetGoal;
  weightKg: number;
  heightCm: number;
  joinedDate: Date;
  streakDays: number;
  weeklyProgressScore: number;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    athleteLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    experienceYears: { type: Number, min: 0, default: 0 },
    targetGoal: { type: String, enum: TARGET_GOALS, default: 'Build Muscle' },
    weightKg: { type: Number, min: 0, default: 0 },
    heightCm: { type: Number, min: 0, default: 0 },
    joinedDate: { type: Date, default: Date.now },
    streakDays: { type: Number, min: 0, default: 0 },
    weeklyProgressScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
