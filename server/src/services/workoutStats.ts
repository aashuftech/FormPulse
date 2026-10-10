export interface WorkoutStatsSet {
  exerciseId: string;
  exerciseName?: string;
  completed?: boolean;
  reps?: number;
  durationSeconds?: number;
  estimatedCalories?: number;
  formScore?: number;
  weightKg?: number;
}

export interface WorkoutStatsSession {
  id?: string;
  durationSeconds?: number;
  startedAt?: Date | string;
  completedAt?: Date | string;
  averageFormScore?: number;
  estimatedCalories?: number;
  totalVolumeKg?: number;
}

export function createWorkoutSummary(session: WorkoutStatsSession, sets: WorkoutStatsSet[]) {
  const completedSets = sets.filter(set => set.completed !== false);
  const estimatedCalories = session.estimatedCalories;
  return {
    exercisesCompleted: new Set(completedSets.map(set => set.exerciseId)).size,
    totalSets: completedSets.length,
    totalReps: completedSets.reduce((sum, set) => sum + (set.reps ?? 0), 0),
    plankDurationSeconds: completedSets.reduce(
      (sum, set) => sum + (set.exerciseId === 'ex_plank' ? (set.durationSeconds ?? 0) : 0),
      0,
    ),
    durationSeconds: session.durationSeconds ?? 0,
    ...(estimatedCalories === undefined ? {} : { estimatedCalories }),
    averageFormScore: session.averageFormScore,
    totalVolumeKg: session.totalVolumeKg ?? 0,
  };
}

function getWeekStart(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}

export function calculateWorkoutProgress(sessions: WorkoutStatsSession[], sets: WorkoutStatsSet[]) {
  const totalCaloriesAvailable = sessions.every(session => session.estimatedCalories !== undefined);
  const totalReps = sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
  const exerciseMap = new Map<
    string,
    {
      exerciseId: string;
      exerciseName: string;
      totalSets: number;
      totalReps: number;
      plankDurationSeconds: number;
      totalCalories: number;
      hasMissingCalories: boolean;
      bestFormScore?: number;
      highestWeightKg?: number;
      highestSetVolumeKg?: number;
      highestRepsPerSet?: number;
    }
  >();

  let longestPlankSeconds = 0;
  let bestFormScore: number | undefined;
  let highestWeightKg: number | undefined;
  let highestSetVolumeKg: number | undefined;
  let highestRepsPerSet: number | undefined;
  for (const set of sets) {
    let exercise = exerciseMap.get(set.exerciseId);
    if (!exercise) {
      exercise = {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName ?? set.exerciseId,
        totalSets: 0,
        totalReps: 0,
        plankDurationSeconds: 0,
        totalCalories: 0,
        hasMissingCalories: false,
      };
      exerciseMap.set(set.exerciseId, exercise);
    }
    exercise.totalSets += 1;
    exercise.totalReps += set.reps ?? 0;
    exercise.plankDurationSeconds += set.exerciseId === 'ex_plank' ? (set.durationSeconds ?? 0) : 0;
    if (set.estimatedCalories === undefined) exercise.hasMissingCalories = true;
    else exercise.totalCalories += set.estimatedCalories;
    if (set.formScore !== undefined) {
      exercise.bestFormScore = Math.max(exercise.bestFormScore ?? 0, set.formScore);
      bestFormScore = Math.max(bestFormScore ?? 0, set.formScore);
    }
    if (set.weightKg !== undefined) {
      exercise.highestWeightKg = Math.max(exercise.highestWeightKg ?? 0, set.weightKg);
      highestWeightKg = Math.max(highestWeightKg ?? 0, set.weightKg);
    }
    if (set.reps !== undefined) {
      exercise.highestRepsPerSet = Math.max(exercise.highestRepsPerSet ?? 0, set.reps);
      highestRepsPerSet = Math.max(highestRepsPerSet ?? 0, set.reps);
      if (set.weightKg !== undefined) {
        const volume = set.weightKg * set.reps;
        exercise.highestSetVolumeKg = Math.max(exercise.highestSetVolumeKg ?? 0, volume);
        highestSetVolumeKg = Math.max(highestSetVolumeKg ?? 0, volume);
      }
    }
    if (set.exerciseId === 'ex_plank') {
      longestPlankSeconds = Math.max(longestPlankSeconds, set.durationSeconds ?? 0);
    }
  }

  const weeklyMap = new Map<
    string,
    {
      weekStart: string;
      workoutCount: number;
      totalVolumeKg: number;
      formScoreTotal: number;
      formScoreCount: number;
    }
  >();
  for (const session of sessions) {
    const end = session.completedAt ?? session.startedAt;
    if (!end) continue;
    const weekStart = getWeekStart(new Date(end)).toISOString().slice(0, 10);
    let week = weeklyMap.get(weekStart);
    if (!week) {
      week = {
        weekStart,
        workoutCount: 0,
        totalVolumeKg: 0,
        formScoreTotal: 0,
        formScoreCount: 0,
      };
      weeklyMap.set(weekStart, week);
    }
    week.workoutCount += 1;
    week.totalVolumeKg += session.totalVolumeKg ?? 0;
    if (session.averageFormScore !== undefined) {
      week.formScoreTotal += session.averageFormScore;
      week.formScoreCount += 1;
    }
  }

  const exerciseProgress = [...exerciseMap.values()].map(exercise => ({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    totalSets: exercise.totalSets,
    totalReps: exercise.totalReps,
    ...(exercise.exerciseId === 'ex_plank'
      ? { totalDurationSeconds: exercise.plankDurationSeconds }
      : {}),
    ...(!exercise.hasMissingCalories ? { estimatedCalories: exercise.totalCalories } : {}),
    ...(exercise.bestFormScore === undefined ? {} : { bestFormScore: exercise.bestFormScore }),
    ...(exercise.highestWeightKg === undefined
      ? {}
      : { highestWeightKg: exercise.highestWeightKg }),
    ...(exercise.highestSetVolumeKg === undefined
      ? {}
      : { highestSetVolumeKg: exercise.highestSetVolumeKg }),
  }));

  return {
    totalWorkouts: sessions.length,
    totalReps,
    totalWorkoutTimeSeconds: sessions.reduce(
      (sum, session) => sum + (session.durationSeconds ?? 0),
      0,
    ),
    ...(totalCaloriesAvailable
      ? {
          totalEstimatedCalories: sessions.reduce(
            (sum, session) => sum + (session.estimatedCalories ?? 0),
            0,
          ),
        }
      : {}),
    exerciseProgress,
    personalRecords: {
      highestRepsPerSet,
      longestPlankSeconds: longestPlankSeconds || undefined,
      bestFormScore,
      highestWeightKg,
      highestSetVolumeKg,
      highestWorkoutVolumeKg:
        sessions.length > 0
          ? Math.max(...sessions.map(session => session.totalVolumeKg ?? 0))
          : undefined,
    },
    weeklyProgress: [...weeklyMap.values()]
      .sort((first, second) => first.weekStart.localeCompare(second.weekStart))
      .slice(-5)
      .map(week => ({
        weekStart: week.weekStart,
        workoutCount: week.workoutCount,
        totalVolumeKg: week.totalVolumeKg,
        averageFormScore:
          week.formScoreCount > 0
            ? Math.round(week.formScoreTotal / week.formScoreCount)
            : undefined,
      })),
  };
}
