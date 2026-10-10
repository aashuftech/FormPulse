import type { ExerciseId } from '../models/Exercise.js';
import type { WorkoutIntensity } from '../models/WorkoutSession.js';

// METs use the closest body-weight/calistenics categories in the Adult Compendium.
export const EXERCISE_CALORIE_RATES: Record<
  ExerciseId,
  { met: number; intensity: WorkoutIntensity }
> = {
  ex_squats: { met: 3, intensity: 'moderate' },
  ex_pushups: { met: 7.5, intensity: 'high' },
  ex_lunges: { met: 3.8, intensity: 'moderate' },
  ex_jumping_jacks: { met: 7.5, intensity: 'high' },
  ex_plank: { met: 2.8, intensity: 'low' },
};

/** kcal = MET × 3.5 × body mass (kg) ÷ 200 × active minutes. */
export function estimateExerciseCalories(
  exerciseId: ExerciseId,
  weightKg: number | null | undefined,
  activeDurationSeconds: number | null | undefined,
) {
  if (
    !Number.isFinite(weightKg) ||
    !weightKg ||
    weightKg <= 0 ||
    !Number.isFinite(activeDurationSeconds) ||
    !activeDurationSeconds ||
    activeDurationSeconds <= 0
  ) {
    return undefined;
  }
  const { met } = EXERCISE_CALORIE_RATES[exerciseId];
  return Math.round((met * 3.5 * weightKg * (activeDurationSeconds / 60)) / 200);
}

export function sumWorkoutCalories(setCalories: Array<number | null | undefined>) {
  if (setCalories.length === 0 || setCalories.some(calories => calories == null)) return undefined;
  return setCalories.reduce<number>((total, calories) => total + (calories ?? 0), 0);
}
