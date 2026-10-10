import { model, Schema, type Document, type Types } from 'mongoose';
import type { ExerciseId, ExerciseTrackingType } from './Exercise.js';
import type { WorkoutIntensity } from './WorkoutSession.js';

export interface IWorkoutSet extends Document {
  userId: Types.ObjectId;
  workoutSessionId: Types.ObjectId;
  exerciseId: ExerciseId;
  exerciseName: string;
  trackingType: ExerciseTrackingType;
  exerciseOrder: number;
  setNumber: number;
  targetReps?: number;
  targetDurationSeconds?: number;
  reps?: number;
  durationSeconds?: number;
  activeDurationSeconds?: number;
  weightKg?: number;
  completed: boolean;
  completedAt?: Date;
  formScore?: number;
  estimatedCalories?: number;
  intensity?: WorkoutIntensity;
  notes?: string;
}

const workoutSetSchema = new Schema<IWorkoutSet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workoutSessionId: { type: Schema.Types.ObjectId, ref: 'WorkoutSession', required: true },
    exerciseId: { type: String, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    trackingType: { type: String, enum: ['reps', 'duration'], required: true },
    exerciseOrder: { type: Number, required: true, min: 0 },
    setNumber: { type: Number, required: true, min: 1, max: 30 },
    targetReps: { type: Number, min: 1, max: 1000 },
    targetDurationSeconds: { type: Number, min: 1, max: 86_400 },
    reps: { type: Number, min: 1, max: 1000 },
    durationSeconds: { type: Number, min: 1, max: 86_400 },
    activeDurationSeconds: { type: Number, min: 1, max: 86_400 },
    weightKg: { type: Number, min: 0, max: 2000 },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date },
    formScore: { type: Number, min: 0, max: 100 },
    estimatedCalories: { type: Number, min: 0, max: 10_000 },
    intensity: { type: String, enum: ['low', 'moderate', 'high'] },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

workoutSetSchema.index(
  { userId: 1, workoutSessionId: 1, exerciseOrder: 1, setNumber: 1 },
  { unique: true },
);

export const WorkoutSet = model<IWorkoutSet>('WorkoutSet', workoutSetSchema);
