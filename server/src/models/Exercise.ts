import { model, Schema, type Document } from 'mongoose';

export const MVP_EXERCISES = [
  { id: 'ex_squats', name: 'Squats', trackingType: 'reps', targetSets: 3, targetReps: 12 },
  { id: 'ex_pushups', name: 'Push-Ups', trackingType: 'reps', targetSets: 3, targetReps: 15 },
  { id: 'ex_lunges', name: 'Lunges', trackingType: 'reps', targetSets: 3, targetReps: 10 },
  {
    id: 'ex_jumping_jacks',
    name: 'Jumping Jacks',
    trackingType: 'reps',
    targetSets: 3,
    targetReps: 30,
  },
  {
    id: 'ex_plank',
    name: 'Plank',
    trackingType: 'duration',
    targetSets: 3,
    targetDurationSeconds: 45,
  },
] as const;

export type ExerciseId = (typeof MVP_EXERCISES)[number]['id'];
export type ExerciseTrackingType = 'reps' | 'duration';

export interface IExercise extends Document<string> {
  _id: ExerciseId;
  name: string;
  trackingType: ExerciseTrackingType;
  targetSets: number;
  targetReps?: number;
  targetDurationSeconds?: number;
}

const exerciseSchema = new Schema<IExercise>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    trackingType: { type: String, enum: ['reps', 'duration'], required: true },
    targetSets: { type: Number, required: true, min: 1, max: 30 },
    targetReps: { type: Number, min: 1, max: 1000 },
    targetDurationSeconds: { type: Number, min: 1, max: 86_400 },
  },
  { versionKey: false },
);

export const Exercise = model<IExercise>('Exercise', exerciseSchema);
