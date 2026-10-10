import { Types } from 'mongoose';
import { getOwnedResourceFilter } from '../middleware/authorization.js';
import { Exercise, MVP_EXERCISES, type ExerciseId } from '../models/Exercise.js';
import { Workout } from '../models/Workout.js';
import {
  WorkoutSession,
  type WorkoutIntensity,
  type WorkoutStatus,
} from '../models/WorkoutSession.js';
import { WorkoutSet, type IWorkoutSet } from '../models/WorkoutSet.js';
import { User } from '../models/User.js';
import { UserProgress } from '../models/UserProgress.js';
import { calculateWorkoutProgress, createWorkoutSummary } from './workoutStats.js';
import { synchronizeChallengeProgress } from './challengeService.js';
import {
  estimateExerciseCalories,
  EXERCISE_CALORIE_RATES,
  sumWorkoutCalories,
} from './calorieEstimation.js';
import { ApiError } from '../utils/ApiError.js';
import type { z } from 'zod';
import type { startWorkoutSchema, updateWorkoutSetSchema } from '../validation/workoutSchemas.js';

type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;
type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
type PlannedExercise = { exerciseId: ExerciseId; setCount: number };

function serializeSession(session: Record<string, unknown>) {
  return {
    id: String(session._id),
    workoutId: session.workoutId ? String(session.workoutId) : undefined,
    title: session.title,
    notes: session.notes,
    status: session.status,
    intensity: session.intensity,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    durationSeconds: session.durationSeconds,
    averageFormScore: session.averageFormScore,
    estimatedCalories: session.estimatedCalories,
    totalVolumeKg: session.totalVolumeKg ?? 0,
  };
}

function serializeSet(set: IWorkoutSet | Record<string, unknown>) {
  return {
    id: String(set._id),
    exerciseId: set.exerciseId,
    exerciseName: set.exerciseName,
    trackingType: set.trackingType,
    exerciseOrder: set.exerciseOrder,
    setNumber: set.setNumber,
    targetReps: set.targetReps,
    targetDurationSeconds: set.targetDurationSeconds,
    reps: set.reps,
    durationSeconds: set.durationSeconds,
    activeDurationSeconds: set.activeDurationSeconds,
    weightKg: set.weightKg,
    completed: set.completed,
    completedAt: set.completedAt,
    formScore: set.formScore,
    estimatedCalories: set.estimatedCalories,
    intensity: set.intensity,
    notes: set.notes,
  };
}

async function ensureExerciseRecords(exerciseIds: ExerciseId[]) {
  const uniqueIds = [...new Set(exerciseIds)];
  await Exercise.bulkWrite(
    uniqueIds.map(exerciseId => {
      const definition = MVP_EXERCISES.find(exercise => exercise.id === exerciseId);
      if (!definition) throw new ApiError(400, 'Choose a supported exercise');
      return {
        updateOne: {
          filter: { _id: exerciseId },
          update: {
            $set: {
              _id: definition.id,
              name: definition.name,
              trackingType: definition.trackingType,
              targetSets: definition.targetSets,
              ...(definition.trackingType === 'reps'
                ? { targetReps: definition.targetReps }
                : { targetDurationSeconds: definition.targetDurationSeconds }),
            },
          },
          upsert: true,
        },
      };
    }),
  );

  const records = await Exercise.find({ _id: { $in: uniqueIds } })
    .select('_id name trackingType targetSets targetReps targetDurationSeconds')
    .lean();
  return new Map(records.map(exercise => [exercise._id, exercise]));
}

export async function startWorkout(userId: Types.ObjectId, input: StartWorkoutInput) {
  let title: string;
  let notes: string | undefined;
  let intensity: WorkoutIntensity | undefined;
  let workoutId: Types.ObjectId | undefined;
  let plannedExercises: PlannedExercise[];

  if ('workoutId' in input) {
    workoutId = new Types.ObjectId(input.workoutId);
    const template = await Workout.findOne({
      ...getOwnedResourceFilter(input.workoutId, userId),
    }).lean();
    if (!template) throw new ApiError(404, 'Workout not found');
    title = template.title;
    notes = template.notes;
    plannedExercises = template.exercises.map(exercise => ({
      exerciseId: exercise.exerciseId,
      setCount: exercise.setCount,
    }));
  } else {
    title = input.title;
    notes = input.notes;
    intensity = input.intensity;
    plannedExercises = input.exercises;
  }

  const exerciseRecords = await ensureExerciseRecords(
    plannedExercises.map(exercise => exercise.exerciseId),
  );
  for (const planned of plannedExercises) {
    const definition = exerciseRecords.get(planned.exerciseId);
    if (!definition || planned.setCount > definition.targetSets) {
      throw new ApiError(400, 'Workout set count exceeds the exercise target');
    }
  }
  const startedAt = new Date();
  const session = await WorkoutSession.create({
    userId,
    workoutId,
    title,
    notes,
    intensity,
    status: 'in-progress',
    startedAt,
  });

  const sets = plannedExercises.flatMap((planned, exerciseOrder) => {
    const exercise = exerciseRecords.get(planned.exerciseId);
    if (!exercise) throw new ApiError(400, 'Choose a supported exercise');
    return Array.from({ length: planned.setCount }, (_, index) => ({
      userId,
      workoutSessionId: session._id,
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      trackingType: exercise.trackingType,
      exerciseOrder,
      setNumber: index + 1,
      targetReps: exercise.targetReps,
      targetDurationSeconds: exercise.targetDurationSeconds,
      completed: false,
    }));
  });

  try {
    await WorkoutSet.insertMany(sets, { ordered: true });
  } catch (error) {
    await WorkoutSession.deleteOne({ _id: session._id, userId });
    throw error;
  }

  return getWorkout(userId, session._id.toString());
}

export async function listWorkouts(
  userId: Types.ObjectId,
  page: number,
  limit: number,
  status: WorkoutStatus,
) {
  const found = await WorkoutSession.find({ userId, status })
    .select(
      '_id workoutId title notes status intensity startedAt completedAt durationSeconds averageFormScore estimatedCalories totalVolumeKg',
    )
    .sort({ startedAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit + 1)
    .lean();
  const hasMore = found.length > limit;
  const workouts = found.slice(0, limit);
  const workoutIds = workouts.map(session => session._id);
  const [total, repTotals] = await Promise.all([
    WorkoutSession.countDocuments({ userId, status }),
    WorkoutSet.aggregate<{ _id: Types.ObjectId; totalReps: number }>([
      { $match: { userId, workoutSessionId: { $in: workoutIds } } },
      { $group: { _id: '$workoutSessionId', totalReps: { $sum: { $ifNull: ['$reps', 0] } } } },
    ]),
  ]);
  const repsByWorkout = new Map(repTotals.map(item => [String(item._id), item.totalReps]));
  return {
    workouts: workouts.map(session => ({
      ...serializeSession(session),
      totalReps: repsByWorkout.get(String(session._id)) ?? 0,
    })),
    page,
    limit,
    total,
    hasMore,
    calorieValuesAreEstimates: true,
  };
}

export async function getWorkout(userId: Types.ObjectId, workoutId: string) {
  const session = await WorkoutSession.findOne(getOwnedResourceFilter(workoutId, userId)).lean();
  if (!session) throw new ApiError(404, 'Workout not found');

  const sets = await WorkoutSet.find({ workoutSessionId: session._id, userId })
    .sort({ exerciseOrder: 1, setNumber: 1 })
    .lean();
  return {
    ...serializeSession(session),
    sets: sets.map(set => serializeSet(set)),
    summary: createWorkoutSummary(session, sets),
    calorieValuesAreEstimates: true,
  };
}

export async function reconcileUserProgress(userId: Types.ObjectId) {
  const user = await User.findById(userId)
    .select('name email heightCm weightKg targetGoal athleteLevel experienceYears')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');

  const sessions = await WorkoutSession.find({ userId, status: 'completed' })
    .select(
      '_id startedAt completedAt durationSeconds averageFormScore estimatedCalories totalVolumeKg',
    )
    .sort({ completedAt: -1, _id: -1 })
    .lean();
  const sets =
    sessions.length === 0
      ? []
      : await WorkoutSet.find({
          userId,
          workoutSessionId: { $in: sessions.map(session => session._id) },
          completed: true,
        })
          .select(
            'workoutSessionId exerciseId exerciseName reps durationSeconds estimatedCalories formScore weightKg',
          )
          .lean();
  const stats = calculateWorkoutProgress(sessions, sets);
  const exerciseKeys = new Set(
    sets.map(set => `${String(set.workoutSessionId)}:${set.exerciseId}`),
  );
  const formScores = sets.flatMap(set => (set.formScore === undefined ? [] : [set.formScore]));
  const snapshot = {
    name: user.name,
    email: user.email,
    profile: {
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      goal: user.targetGoal,
      athleteLevel: user.athleteLevel,
      experienceYears: user.experienceYears,
    },
    totalWorkouts: stats.totalWorkouts,
    totalExercises: exerciseKeys.size,
    totalSets: sets.length,
    totalReps: stats.totalReps,
    totalDurationSeconds: sets.reduce((sum, set) => sum + (set.durationSeconds ?? 0), 0),
    totalWorkoutTimeSeconds: stats.totalWorkoutTimeSeconds,
    totalVolumeKg: sessions.reduce((sum, session) => sum + (session.totalVolumeKg ?? 0), 0),
    averageFormScore:
      formScores.length > 0
        ? Math.round((formScores.reduce((sum, score) => sum + score, 0) / formScores.length) * 10) /
          10
        : undefined,
    lastCompletedAt: sessions[0]?.completedAt,
    exerciseProgress: stats.exerciseProgress,
    personalRecords: stats.personalRecords,
    weeklyProgress: stats.weeklyProgress,
    ...(stats.totalEstimatedCalories === undefined
      ? {}
      : { totalEstimatedCalories: stats.totalEstimatedCalories }),
  };
  const update = {
    $set: { ...snapshot, userId },
    ...(snapshot.totalEstimatedCalories === undefined
      ? { $unset: { totalEstimatedCalories: 1 } }
      : {}),
  };

  let progress;
  try {
    progress = await UserProgress.findOneAndUpdate({ userId }, update, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }).lean();
  } catch (error) {
    // Concurrent first-time progress requests can race on the unique userId index.
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 11000) {
      throw error;
    }
    progress = await UserProgress.findOneAndUpdate({ userId }, update, {
      new: true,
      runValidators: true,
    }).lean();
  }
  if (!progress) throw new ApiError(500, 'Workout progress could not be saved');
  return {
    totalWorkouts: progress.totalWorkouts,
    totalExercises: progress.totalExercises,
    totalSets: progress.totalSets,
    totalReps: progress.totalReps,
    totalDurationSeconds: progress.totalDurationSeconds,
    totalWorkoutTimeSeconds: progress.totalWorkoutTimeSeconds,
    ...(progress.totalEstimatedCalories === undefined
      ? {}
      : { totalEstimatedCalories: progress.totalEstimatedCalories }),
    totalVolumeKg: progress.totalVolumeKg,
    ...(progress.averageFormScore === undefined
      ? {}
      : { averageFormScore: progress.averageFormScore }),
    ...(progress.lastCompletedAt === undefined
      ? {}
      : { lastCompletedAt: progress.lastCompletedAt }),
    exerciseProgress: progress.exerciseProgress,
    personalRecords: progress.personalRecords,
    weeklyProgress: progress.weeklyProgress,
  };
}

/** Backfills or repairs one aggregate for every existing account with workout or progress data. */
export async function backfillUserProgress() {
  const [completedWorkoutOwners, existingProgressOwners] = await Promise.all([
    WorkoutSession.distinct('userId', { status: 'completed' }),
    UserProgress.distinct('userId'),
  ]);
  const candidateIds = [
    ...new Map(
      [...completedWorkoutOwners, ...existingProgressOwners].map(id => [String(id), id]),
    ).values(),
  ];
  if (candidateIds.length === 0) {
    return { usersScanned: 0, recordsCreated: 0, recordsUpdated: 0 };
  }

  const users = await User.find({ _id: { $in: candidateIds } })
    .select('_id')
    .lean();
  let recordsCreated = 0;
  let recordsUpdated = 0;
  for (const user of users) {
    const existing = await UserProgress.exists({ userId: user._id });
    await reconcileUserProgress(user._id);
    if (existing) recordsUpdated += 1;
    else recordsCreated += 1;
  }
  return { usersScanned: users.length, recordsCreated, recordsUpdated };
}

export const getWorkoutProgress = reconcileUserProgress;

export async function updateWorkoutSet(
  userId: Types.ObjectId,
  workoutId: string,
  setId: string,
  input: UpdateWorkoutSetInput,
) {
  const sessionFilter = getOwnedResourceFilter(workoutId, userId);
  const session = await WorkoutSession.findOne({ ...sessionFilter, status: 'in-progress' })
    .select('_id')
    .lean();
  if (!session) throw new ApiError(404, 'Workout not found');

  const setFilter = {
    _id: new Types.ObjectId(setId),
    workoutSessionId: session._id,
    userId,
  };
  const currentSet = await WorkoutSet.findOne(setFilter).lean();
  if (!currentSet) throw new ApiError(404, 'Workout set not found');
  if (currentSet.completed) throw new ApiError(409, 'This workout set is already complete');

  const nextSet = await WorkoutSet.findOne({
    userId,
    workoutSessionId: session._id,
    completed: false,
  })
    .sort({ exerciseOrder: 1, setNumber: 1 })
    .select('_id')
    .lean();
  if (!nextSet || !nextSet._id.equals(currentSet._id)) {
    throw new ApiError(409, 'Complete the current set before moving to the next one');
  }

  if (
    (currentSet.trackingType === 'reps' && input.durationSeconds !== undefined) ||
    (currentSet.trackingType === 'duration' && input.reps !== undefined)
  ) {
    throw new ApiError(400, 'Set progress does not match the exercise tracking type');
  }
  if (
    (input.reps !== undefined &&
      currentSet.targetReps !== undefined &&
      input.reps > currentSet.targetReps) ||
    (input.durationSeconds !== undefined &&
      currentSet.targetDurationSeconds !== undefined &&
      input.durationSeconds > currentSet.targetDurationSeconds)
  ) {
    throw new ApiError(400, 'Set progress cannot exceed the exercise target');
  }

  const reps = input.reps ?? currentSet.reps;
  const durationSeconds = input.durationSeconds ?? currentSet.durationSeconds;
  const completed = input.completed ?? currentSet.completed;
  if (
    completed &&
    ((currentSet.trackingType === 'reps' && reps === undefined) ||
      (currentSet.trackingType === 'duration' && durationSeconds === undefined))
  ) {
    throw new ApiError(400, 'Add the required reps or duration before completing this set');
  }
  const setValues: Record<string, unknown> = { ...input };
  delete setValues.activeDurationSeconds;
  if (completed) {
    const user = await User.findById(userId).select('weightKg').lean();
    const activeDurationSeconds =
      currentSet.trackingType === 'duration' ? durationSeconds : input.activeDurationSeconds;
    const estimatedCalories = estimateExerciseCalories(
      currentSet.exerciseId,
      user?.weightKg,
      activeDurationSeconds,
    );
    if (estimatedCalories === undefined) {
      delete setValues.estimatedCalories;
    } else {
      setValues.estimatedCalories = estimatedCalories;
    }
    setValues.intensity = EXERCISE_CALORIE_RATES[currentSet.exerciseId].intensity;
    if (activeDurationSeconds !== undefined) {
      setValues.activeDurationSeconds = activeDurationSeconds;
    }
  }
  if (Object.hasOwn(input, 'completed')) {
    setValues.completedAt = input.completed ? new Date() : null;
  }
  const setUpdate: Record<string, unknown> = { $set: setValues };
  if (completed && setValues.estimatedCalories === undefined) {
    setUpdate.$unset = { estimatedCalories: 1 };
  }
  const updated = await WorkoutSet.findOneAndUpdate({ ...setFilter, completed: false }, setUpdate, {
    new: true,
    runValidators: true,
  }).lean();
  if (!updated) throw new ApiError(409, 'Workout set progress has already changed');
  if (!currentSet.completed && updated.completed) {
    await synchronizeChallengeProgress(userId);
  }
  return serializeSet(updated);
}

export async function completeWorkout(userId: Types.ObjectId, workoutId: string) {
  const sessionFilter = getOwnedResourceFilter(workoutId, userId);
  const session = await WorkoutSession.findOne({ ...sessionFilter, status: 'in-progress' }).lean();
  if (!session) throw new ApiError(404, 'Workout not found');

  const sets = await WorkoutSet.find({ workoutSessionId: session._id, userId })
    .select('completed formScore estimatedCalories reps weightKg')
    .lean();
  if (sets.length === 0 || sets.some(set => !set.completed)) {
    throw new ApiError(409, 'Complete every set before completing the workout');
  }

  const completedAt = new Date();
  const formScores = sets.flatMap(set => (set.formScore === undefined ? [] : [set.formScore]));
  const averageFormScore =
    formScores.length > 0
      ? Math.round((formScores.reduce((sum, score) => sum + score, 0) / formScores.length) * 10) /
        10
      : undefined;
  const estimatedCalories = sumWorkoutCalories(sets.map(set => set.estimatedCalories));
  const totalVolumeKg = sets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  const updated = await WorkoutSession.findOneAndUpdate(
    { ...sessionFilter, status: 'in-progress' },
    {
      $set: {
        status: 'completed',
        completedAt,
        durationSeconds: Math.max(
          0,
          Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000),
        ),
        totalVolumeKg,
        ...(estimatedCalories === undefined ? {} : { estimatedCalories }),
        ...(averageFormScore === undefined ? {} : { averageFormScore }),
      },
      ...(estimatedCalories === undefined ? { $unset: { estimatedCalories: 1 } } : {}),
    },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) throw new ApiError(404, 'Workout not found');
  await synchronizeChallengeProgress(userId);
  await getWorkoutProgress(userId);
  return getWorkout(userId, updated._id.toString());
}

export async function cancelWorkout(userId: Types.ObjectId, workoutId: string) {
  const sessionFilter = getOwnedResourceFilter(workoutId, userId);
  const session = await WorkoutSession.findOne({ ...sessionFilter, status: 'in-progress' }).lean();
  if (!session) throw new ApiError(404, 'Workout not found');
  const cancelledAt = new Date();
  const updated = await WorkoutSession.findOneAndUpdate(
    { ...sessionFilter, status: 'in-progress' },
    {
      $set: {
        status: 'cancelled',
        durationSeconds: Math.max(
          0,
          Math.floor((cancelledAt.getTime() - session.startedAt.getTime()) / 1000),
        ),
      },
    },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) throw new ApiError(404, 'Workout not found');
  return { ...serializeSession(updated), calorieValuesAreEstimates: true };
}
