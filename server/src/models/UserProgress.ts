import { model, Schema, type Document, type Types } from 'mongoose';
import { TARGET_GOALS, type IUser } from './User.js';

export interface IUserProgress extends Document {
  userId: Types.ObjectId;
  name: string;
  email: string;
  profile: {
    heightCm: number;
    weightKg: number;
    goal: (typeof TARGET_GOALS)[number];
    athleteLevel: IUser['athleteLevel'];
    experienceYears: number;
  };
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalDurationSeconds: number;
  totalWorkoutTimeSeconds: number;
  totalEstimatedCalories?: number;
  totalVolumeKg: number;
  averageFormScore?: number;
  lastCompletedAt?: Date;
  exerciseProgress: Array<{
    exerciseId: string;
    exerciseName: string;
    totalSets: number;
    totalReps: number;
    totalDurationSeconds?: number;
    estimatedCalories?: number;
    bestFormScore?: number;
    highestWeightKg?: number;
    highestSetVolumeKg?: number;
  }>;
  personalRecords: {
    highestRepsPerSet?: number;
    longestPlankSeconds?: number;
    bestFormScore?: number;
    highestWeightKg?: number;
    highestSetVolumeKg?: number;
    highestWorkoutVolumeKg?: number;
  };
  weeklyProgress: Array<{
    weekStart: string;
    workoutCount: number;
    totalVolumeKg: number;
    averageFormScore?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseProgressSchema = new Schema(
  {
    exerciseId: { type: String, required: true },
    exerciseName: { type: String, required: true },
    totalSets: { type: Number, required: true, min: 0 },
    totalReps: { type: Number, required: true, min: 0 },
    totalDurationSeconds: { type: Number, min: 0 },
    estimatedCalories: { type: Number, min: 0 },
    bestFormScore: { type: Number, min: 0, max: 100 },
    highestWeightKg: { type: Number, min: 0 },
    highestSetVolumeKg: { type: Number, min: 0 },
  },
  { _id: false },
);

const personalRecordsSchema = new Schema(
  {
    highestRepsPerSet: { type: Number, min: 0 },
    longestPlankSeconds: { type: Number, min: 0 },
    bestFormScore: { type: Number, min: 0, max: 100 },
    highestWeightKg: { type: Number, min: 0 },
    highestSetVolumeKg: { type: Number, min: 0 },
    highestWorkoutVolumeKg: { type: Number, min: 0 },
  },
  { _id: false },
);

const weeklyProgressSchema = new Schema(
  {
    weekStart: { type: String, required: true },
    workoutCount: { type: Number, required: true, min: 0 },
    totalVolumeKg: { type: Number, required: true, min: 0 },
    averageFormScore: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const userProfileSchema = new Schema(
  {
    heightCm: { type: Number, required: true, min: 0, max: 300, default: 0 },
    weightKg: { type: Number, required: true, min: 0, max: 2000, default: 0 },
    goal: { type: String, enum: TARGET_GOALS, required: true, default: 'Build Muscle' },
    athleteLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Beginner',
    },
    experienceYears: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    profile: { type: userProfileSchema, required: true, default: () => ({}) },
    totalWorkouts: { type: Number, required: true, min: 0, default: 0 },
    totalExercises: { type: Number, required: true, min: 0, default: 0 },
    totalSets: { type: Number, required: true, min: 0, default: 0 },
    totalReps: { type: Number, required: true, min: 0, default: 0 },
    totalDurationSeconds: { type: Number, required: true, min: 0, default: 0 },
    totalWorkoutTimeSeconds: { type: Number, required: true, min: 0, default: 0 },
    totalEstimatedCalories: { type: Number, min: 0 },
    totalVolumeKg: { type: Number, required: true, min: 0, default: 0 },
    averageFormScore: { type: Number, min: 0, max: 100 },
    lastCompletedAt: { type: Date },
    exerciseProgress: { type: [exerciseProgressSchema], default: [] },
    personalRecords: { type: personalRecordsSchema, default: () => ({}) },
    weeklyProgress: { type: [weeklyProgressSchema], default: [] },
  },
  { timestamps: true },
);

export const UserProgress = model<IUserProgress>('UserProgress', userProgressSchema);
