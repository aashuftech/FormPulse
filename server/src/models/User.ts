import { model, Schema, type Document } from 'mongoose';

export const TARGET_GOALS = [
  'Build Muscle',
  'Build Strength',
  'Increase Endurance',
  'Lose Fat',
  'Improve Mobility',
] as const;

export type TargetGoal = (typeof TARGET_GOALS)[number];
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const FORM_STRICTNESS = ['Relaxed', 'Standard', 'Strict'] as const;
export const UNIT_SYSTEMS = ['Metric (kg)', 'Imperial (lbs)'] as const;

export interface IUserSettings {
  voiceGuidance: boolean;
  vibrationAlerts: boolean;
  formStrictness: (typeof FORM_STRICTNESS)[number];
  unitSystem: (typeof UNIT_SYSTEMS)[number];
  emailNotifications: boolean;
  theme: 'dark';
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  role: UserRole;
  athleteLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  experienceYears: number;
  targetGoal: TargetGoal;
  weightKg: number;
  heightCm: number;
  joinedDate: Date;
  streakDays: number;
  weeklyProgressScore: number;
  settings: IUserSettings;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    voiceGuidance: { type: Boolean, default: true },
    vibrationAlerts: { type: Boolean, default: true },
    formStrictness: { type: String, enum: FORM_STRICTNESS, default: 'Standard' },
    unitSystem: { type: String, enum: UNIT_SYSTEMS, default: 'Metric (kg)' },
    emailNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['dark'], default: 'dark' },
  },
  { _id: false },
);

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
    // Missing values on legacy accounts default to verified; registration explicitly sets false.
    emailVerified: { type: Boolean, required: true, default: true },
    role: { type: String, enum: USER_ROLES, required: true, default: 'user' },
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
    settings: { type: userSettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
