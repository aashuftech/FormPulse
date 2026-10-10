import { z } from 'zod';
import { MVP_EXERCISES, type ExerciseId } from '../models/Exercise.js';
import { WORKOUT_INTENSITIES, WORKOUT_STATUSES } from '../models/WorkoutSession.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid workout identifier');
const exerciseIdSchema = z
  .string()
  .refine((value): value is ExerciseId => MVP_EXERCISES.some(exercise => exercise.id === value), {
    message: 'Choose a supported exercise',
  });
const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

const directExerciseSchema = z
  .object({
    exerciseId: exerciseIdSchema,
    setCount: z.number().int().min(1).max(30),
  })
  .strict();

export const startWorkoutSchema = z.union([
  z.object({ workoutId: objectIdSchema }).strict(),
  z
    .object({
      title: z.string().trim().min(2).max(100),
      notes: optionalText(1000),
      intensity: z.enum(WORKOUT_INTENSITIES).optional(),
      exercises: z.array(directExerciseSchema).min(1).max(20),
    })
    .strict(),
]);

export const updateWorkoutSetSchema = z
  .object({
    reps: z.number().int().min(1).max(1000).optional(),
    durationSeconds: z.number().int().min(1).max(86_400).optional(),
    activeDurationSeconds: z.number().int().min(1).max(86_400).optional(),
    weightKg: z.number().min(0).max(2000).optional(),
    completed: z.boolean().optional(),
    formScore: z.number().min(0).max(100).optional(),
    intensity: z.enum(WORKOUT_INTENSITIES).optional(),
    notes: optionalText(500),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, 'Provide at least one set field to update');

export const completeWorkoutSchema = z.preprocess(
  value => (value === undefined ? {} : value),
  z.object({}).strict(),
);

export const workoutHistoryQuerySchema = z
  .object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(10_000))
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
    status: z.enum(WORKOUT_STATUSES).optional(),
  })
  .strict()
  .transform(({ page = 1, limit = 20, status = 'completed' }) => ({ page, limit, status }));

export const workoutParamsSchema = z.object({
  workoutId: objectIdSchema,
  setId: objectIdSchema.optional(),
});
