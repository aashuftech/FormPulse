import { model, Schema, type Document, type Types } from 'mongoose';

export const WORKOUT_STATUSES = ['in-progress', 'completed', 'cancelled'] as const;
export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number];
export const WORKOUT_INTENSITIES = ['low', 'moderate', 'high'] as const;
export type WorkoutIntensity = (typeof WORKOUT_INTENSITIES)[number];

export interface IWorkoutSession extends Document {
  userId: Types.ObjectId;
  workoutId?: Types.ObjectId;
  title: string;
  notes?: string;
  status: WorkoutStatus;
  intensity?: WorkoutIntensity;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  averageFormScore?: number;
  estimatedCalories?: number;
  totalVolumeKg: number;
}

const workoutSessionSchema = new Schema<IWorkoutSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workoutId: { type: Schema.Types.ObjectId, ref: 'Workout' },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    notes: { type: String, maxlength: 1000 },
    status: { type: String, enum: WORKOUT_STATUSES, required: true, default: 'in-progress' },
    intensity: { type: String, enum: WORKOUT_INTENSITIES },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    durationSeconds: { type: Number, min: 0 },
    averageFormScore: { type: Number, min: 0, max: 100 },
    estimatedCalories: { type: Number, min: 0, max: 100_000 },
    totalVolumeKg: { type: Number, min: 0, max: 1_000_000, default: 0 },
  },
  { timestamps: true },
);

workoutSessionSchema.index({ userId: 1, status: 1, startedAt: -1, _id: -1 });

export const WorkoutSession = model<IWorkoutSession>('WorkoutSession', workoutSessionSchema);
