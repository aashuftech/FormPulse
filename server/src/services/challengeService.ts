import type { Types } from 'mongoose';
import { WorkoutSession } from '../models/WorkoutSession.js';
import { WorkoutSet } from '../models/WorkoutSet.js';
import { getOwnedResourceFilter } from '../middleware/authorization.js';
import { Challenge, type IChallenge } from '../models/Challenge.js';
import type { ChallengeMetric } from '../models/Challenge.js';
import { ApiError } from '../utils/ApiError.js';
import type { z } from 'zod';
import type {
  createChallengeSchema,
  updateChallengeSchema,
} from '../validation/challengeSchemas.js';

type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
type ProgressSet = {
  completedAt?: Date;
  reps?: number;
  durationSeconds?: number;
  weightKg?: number;
  formScore?: number;
  estimatedCalories?: number;
};
type ProgressWorkout = { completedAt?: Date };

export function calculateChallengeProgress(
  metric: ChallengeMetric,
  targetValue: number,
  createdAt: Date,
  deadline: Date | undefined,
  sets: ProgressSet[],
  sessions: ProgressWorkout[],
) {
  const inWindow = (date?: Date) =>
    Boolean(date && date >= createdAt && (!deadline || date <= deadline));
  const challengeSets = sets.filter(set => inWindow(set.completedAt));
  const challengeSessions = sessions.filter(session => inWindow(session.completedAt));
  const value =
    metric === 'reps'
      ? challengeSets.reduce((sum, set) => sum + (set.reps ?? 0), 0)
      : metric === 'sets'
        ? challengeSets.length
        : metric === 'workouts'
          ? challengeSessions.length
          : metric === 'volumeKg'
            ? challengeSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0)
            : metric === 'calories'
              ? challengeSets.reduce((sum, set) => sum + (set.estimatedCalories ?? 0), 0)
              : metric === 'durationSeconds'
                ? challengeSets.reduce((sum, set) => sum + (set.durationSeconds ?? 0), 0)
                : challengeSets.reduce((best, set) => Math.max(best, set.formScore ?? 0), 0);
  return Math.min(targetValue, value);
}

function legacyMetric(goal: string): ChallengeMetric | undefined {
  try {
    return parseChallengeGoal(goal).metric;
  } catch {
    return undefined;
  }
}

function serializeChallenge(challenge: IChallenge | Record<string, unknown>) {
  const deadline = challenge.deadline instanceof Date ? challenge.deadline : new Date();
  return {
    id: String(challenge._id),
    title: challenge.title,
    category: challenge.category,
    goal: challenge.goal,
    description: challenge.description,
    targetValue: challenge.targetValue,
    currentValue: challenge.currentValue,
    metric: challenge.metric,
    unit: challenge.unit,
    deadline: deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    rewardBadge: challenge.rewardBadge,
    participantsCount: challenge.participantsCount,
    status: challenge.status,
    isJoined: challenge.isJoined,
  };
}

export function parseChallengeGoal(goal: string) {
  const match = /(\d[\d,]*(?:\.\d+)?)/.exec(goal);
  if (!match) throw new ApiError(400, 'Goal must include a valid numeric target');
  let targetValue = Number(match[1].replaceAll(',', ''));
  if (!Number.isFinite(targetValue) || targetValue <= 0 || targetValue > 1_000_000_000) {
    throw new ApiError(
      400,
      'Challenge target must be greater than zero and within the allowed range',
    );
  }

  const keywords: Array<{ expression: RegExp; metric: ChallengeMetric; unit: string }> = [
    { expression: /form\s*score|score\b/, metric: 'formScore', unit: 'Score' },
    { expression: /reps?\b/, metric: 'reps', unit: 'Reps' },
    { expression: /sets?\b/, metric: 'sets', unit: 'Sets' },
    { expression: /workouts?\b|sessions?\b/, metric: 'workouts', unit: 'Workouts' },
    { expression: /calories?\b|kcal\b/, metric: 'calories', unit: 'kcal' },
    { expression: /kg\b|volume\b/, metric: 'volumeKg', unit: 'kg' },
    {
      expression: /seconds?\b|minutes?\b|hours?\b|duration\b|time\b/,
      metric: 'durationSeconds',
      unit: 'seconds',
    },
  ];
  const normalized = goal.toLowerCase();
  const targetPosition = match.index ?? 0;
  const selected = keywords
    .flatMap(keyword => {
      const keywordMatch = keyword.expression.exec(normalized);
      return keywordMatch
        ? [{ ...keyword, distance: Math.abs(keywordMatch.index - targetPosition) }]
        : [];
    })
    .sort((first, second) => first.distance - second.distance)[0];
  if (!selected) {
    throw new ApiError(
      400,
      'Goal must specify reps, sets, workouts, kg, calories, duration, or form score',
    );
  }

  const { metric } = selected;
  let { unit } = selected;
  if (metric === 'formScore' && targetValue > 100) {
    throw new ApiError(400, 'Form score targets cannot exceed 100');
  }
  if (metric === 'durationSeconds') {
    if (/hour/.test(normalized)) targetValue *= 3600;
    else if (/minute/.test(normalized)) targetValue *= 60;
  }
  if (!Number.isFinite(targetValue) || targetValue > 1_000_000_000) {
    throw new ApiError(400, 'Challenge target is outside the allowed range');
  }
  if (['reps', 'sets', 'workouts'].includes(metric) && !Number.isInteger(targetValue)) {
    throw new ApiError(400, 'Rep, set, and workout targets must be whole numbers');
  }

  const suffix = goal.slice(match.index + match[0].length).trim();
  if ((metric === 'reps' && /rep/i.test(suffix)) || (metric === 'sets' && /set/i.test(suffix))) {
    unit = suffix.slice(0, 50);
  }
  return { targetValue, metric, unit };
}

export async function createChallenge(userId: Types.ObjectId, input: CreateChallengeInput) {
  const { targetValue, unit, metric } = parseChallengeGoal(input.goal);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const challenge = await Challenge.create({
    userId,
    title: input.title,
    goal: input.goal,
    category: 'Consistency',
    description: 'Personal challenge created for your fitness goals.',
    targetValue,
    currentValue: 0,
    metric,
    unit,
    deadline,
    rewardBadge: 'Personal Goal',
    participantsCount: 1,
    status: 'active',
    isJoined: true,
  });
  return serializeChallenge(challenge);
}

export async function listChallenges(userId: Types.ObjectId) {
  await synchronizeChallengeProgress(userId);
  const challenges = await Challenge.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
  return challenges.map(challenge => serializeChallenge(challenge));
}

export async function updateChallenge(
  userId: Types.ObjectId,
  challengeId: string,
  input: UpdateChallengeInput,
) {
  const challenge = await Challenge.findOne(getOwnedResourceFilter(challengeId, userId));
  if (!challenge) throw new ApiError(404, 'Challenge not found');
  if (challenge.status === 'completed')
    throw new ApiError(409, 'Completed challenges cannot be changed');

  const existingMetric = challenge.metric ?? legacyMetric(challenge.goal);
  if (input.goal) {
    const target = parseChallengeGoal(input.goal);
    if (existingMetric && target.metric !== existingMetric) {
      throw new ApiError(400, 'Challenge goal must keep the same progress type');
    }
    if (!existingMetric && challenge.currentValue > 0) {
      throw new ApiError(409, 'A challenge with existing progress cannot change its goal type');
    }
    challenge.goal = input.goal;
    challenge.targetValue = target.targetValue;
    challenge.unit = target.unit;
    challenge.metric = target.metric;
  } else if (existingMetric) {
    challenge.metric = existingMetric;
  } else {
    throw new ApiError(409, 'This older challenge has an unsupported goal and cannot be edited');
  }
  challenge.title = input.title ?? challenge.title;
  if (challenge.currentValue >= challenge.targetValue) {
    challenge.currentValue = challenge.targetValue;
    challenge.status = 'completed';
  }
  await challenge.save();
  return serializeChallenge(challenge);
}

export async function deleteChallenge(userId: Types.ObjectId, challengeId: string) {
  const deleted = await Challenge.findOneAndDelete(getOwnedResourceFilter(challengeId, userId));
  if (!deleted) throw new ApiError(404, 'Challenge not found');
}

/** Rebuilds each personal challenge independently from completed, owned workout records. */
export async function synchronizeChallengeProgress(userId: Types.ObjectId) {
  const challenges = await Challenge.find({ userId, status: 'active' })
    .select('_id metric targetValue currentValue createdAt deadline goal unit')
    .lean();
  if (challenges.length === 0) return;
  const earliestStart = challenges.reduce(
    (earliest, challenge) => (challenge.createdAt < earliest ? challenge.createdAt : earliest),
    challenges[0]!.createdAt,
  );
  const [sets, sessions] = await Promise.all([
    WorkoutSet.find({ userId, completed: true, completedAt: { $gte: earliestStart } })
      .select(
        'workoutSessionId completedAt reps durationSeconds weightKg formScore estimatedCalories',
      )
      .lean(),
    WorkoutSession.find({ userId, status: 'completed', completedAt: { $gte: earliestStart } })
      .select('_id completedAt')
      .lean(),
  ]);

  await Promise.all(
    challenges.map(async challenge => {
      const metric = challenge.metric ?? legacyMetric(challenge.goal);
      if (!metric) return;
      const currentValue = calculateChallengeProgress(
        metric,
        challenge.targetValue,
        challenge.createdAt,
        challenge.deadline,
        sets,
        sessions,
      );
      await Challenge.updateOne(
        { _id: challenge._id, userId, status: 'active' },
        {
          $set: {
            currentValue,
            metric,
            ...(currentValue >= challenge.targetValue ? { status: 'completed' } : {}),
          },
        },
      );
    }),
  );
}
