import { model, Schema, type Document, type Types } from 'mongoose';
import type { ExerciseId } from './Exercise.js';

export interface IWorkoutExercise {
  exerciseId: ExerciseId;
  setCount: number;
  targetReps?: number;
  targetDurationSeconds?: number;
}

export interface IWorkout extends Document {
  userId: Types.ObjectId;
  title: string;
  notes?: string;
  exercises: IWorkoutExercise[];
}

const workoutExerciseSchema = new Schema<IWorkoutExercise>(
  {
    exerciseId: { type: String, ref: 'Exercise', required: true },
    setCount: { type: Number, required: true, min: 1, max: 30 },
    targetReps: { type: Number, min: 1, max: 1000 },
    targetDurationSeconds: { type: Number, min: 1, max: 86_400 },
  },
  { _id: false },
);

const workoutSchema = new Schema<IWorkout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    notes: { type: String, maxlength: 1000 },
    exercises: {
      type: [workoutExerciseSchema],
      required: true,
      validate: [(items: unknown[]) => items.length > 0, 'Workout requires exercises'],
    },
  },
  { timestamps: true },
);

export const Workout = model<IWorkout>('Workout', workoutSchema);
