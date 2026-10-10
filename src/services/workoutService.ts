import type { Exercise, WorkoutSession, WorkoutSet, WorkoutSummary } from '@/types';
import { MOCK_EXERCISES } from './mockData';
import { authenticatedRequest } from './authApi';

interface ApiSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseOrder: number;
  setNumber: number;
  trackingType: 'reps' | 'duration';
  targetReps?: number;
  targetDurationSeconds?: number;
  reps?: number;
  durationSeconds?: number;
  weightKg?: number;
  completed: boolean;
  formScore?: number;
  estimatedCalories?: number;
}

interface ApiWorkout {
  id: string;
  title: string;
  notes?: string;
  status: 'in-progress' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  averageFormScore?: number;
  estimatedCalories?: number;
  totalVolumeKg?: number;
  totalReps?: number;
  sets?: ApiSet[];
  summary?: WorkoutSummary;
}

export interface WorkoutProgress {
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  totalDurationSeconds: number;
  totalWorkoutTimeSeconds: number;
  totalVolumeKg: number;
  averageFormScore?: number;
  lastCompletedAt?: string;
  totalEstimatedCalories?: number;
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
}

interface ApiWorkoutProgressResponse {
  profile: {
    id: string;
    name: string;
    email: string;
    athleteLevel: string;
    experienceYears: number;
    targetGoal: string;
    weightKg: number;
    heightCm: number;
  };
  progress: WorkoutProgress;
}

interface ApiWorkoutSetResponse {
  set: ApiSet;
}

interface ApiWorkoutResponse {
  workout: ApiWorkout;
}

interface ApiHistoryResponse {
  workouts: ApiWorkout[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface WorkoutHistoryPage {
  workouts: WorkoutSession[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface WorkoutSetProgress {
  reps?: number;
  durationSeconds?: number;
  weightKg?: number;
  formScore?: number;
  activeDurationSeconds?: number;
  completed: true;
}

function findExercise(exerciseId: string): Exercise {
  const exercise = MOCK_EXERCISES.find(item => item.id === exerciseId);
  if (!exercise) throw new Error('This exercise is not available in the workout library');
  return exercise;
}

function mapSet(set: ApiSet): WorkoutSet {
  return {
    id: set.id,
    setNumber: set.setNumber,
    targetReps: set.targetReps,
    targetDurationSeconds: set.targetDurationSeconds,
    reps: set.reps,
    durationSeconds: set.durationSeconds,
    estimatedCalories: set.estimatedCalories,
    weightKg: set.weightKg,
    completed: set.completed,
    accuracyScore: set.formScore,
  };
}

function mapWorkout(workout: ApiWorkout): WorkoutSession {
  const exercises = new Map<
    number,
    { exerciseId: string; exercise: Exercise; sets: WorkoutSet[] }
  >();
  for (const set of workout.sets ?? []) {
    let item = exercises.get(set.exerciseOrder);
    if (!item) {
      const exercise = findExercise(set.exerciseId);
      item = { exerciseId: set.exerciseId, exercise, sets: [] };
      exercises.set(set.exerciseOrder, item);
    }
    item.sets.push(mapSet(set));
  }

  return {
    id: workout.id,
    title: workout.title,
    description: workout.notes,
    startTime: workout.startedAt,
    endTime: workout.completedAt,
    durationMinutes: Math.floor((workout.durationSeconds ?? 0) / 60),
    exercises: [...exercises.values()],
    status: workout.status === 'cancelled' ? 'abandoned' : workout.status,
    averageFormScore: workout.averageFormScore,
    caloriesBurned: workout.estimatedCalories,
    totalVolumeKg: workout.totalVolumeKg ?? 0,
    totalReps: workout.totalReps,
    summary: workout.summary,
  };
}

export const workoutService = {
  async start(title: string, exerciseIds: string[]): Promise<WorkoutSession> {
    const exercises = exerciseIds.map(exerciseId => {
      const exercise = findExercise(exerciseId);
      return { exerciseId, setCount: exercise.targetSetsDefault };
    });
    const response = await authenticatedRequest<ApiWorkoutResponse>('/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, exercises }),
    });
    return mapWorkout(response.workout);
  },

  async updateSet(
    workoutId: string,
    setId: string,
    progress: WorkoutSetProgress,
  ): Promise<WorkoutSet> {
    const response = await authenticatedRequest<ApiWorkoutSetResponse>(
      `/workouts/${encodeURIComponent(workoutId)}/sets/${encodeURIComponent(setId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress),
      },
    );
    return mapSet(response.set);
  },

  async complete(workoutId: string): Promise<WorkoutSession> {
    const response = await authenticatedRequest<ApiWorkoutResponse>(
      `/workouts/${encodeURIComponent(workoutId)}/complete`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    );
    return mapWorkout(response.workout);
  },

  async getHistory(page = 1, limit = 20): Promise<WorkoutHistoryPage> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status: 'completed',
    });
    const response = await authenticatedRequest<ApiHistoryResponse>(
      `/workouts?${query.toString()}`,
    );
    return { ...response, workouts: response.workouts.map(mapWorkout) };
  },

  async getProgress(): Promise<WorkoutProgress> {
    const response = await authenticatedRequest<ApiWorkoutProgressResponse>('/workouts/progress');
    return response.progress;
  },

  async getById(id: string): Promise<WorkoutSession> {
    const response = await authenticatedRequest<ApiWorkoutResponse>(
      `/workouts/${encodeURIComponent(id)}`,
    );
    return mapWorkout(response.workout);
  },
};
