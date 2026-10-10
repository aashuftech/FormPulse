import type { RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/authorization.js';
import {
  cancelWorkout,
  completeWorkout,
  getWorkout,
  getWorkoutProgress,
  listWorkouts,
  startWorkout,
  updateWorkoutSet,
} from '../services/workoutService.js';
import { ApiError } from '../utils/ApiError.js';
import { workoutHistoryQuerySchema } from '../validation/workoutSchemas.js';

export const startWorkoutController: RequestHandler = async (request, response) => {
  const workout = await startWorkout(getAuthenticatedUser(request)._id, request.body);
  response.status(201).json({ workout });
};

export const listWorkoutsController: RequestHandler = async (request, response) => {
  const pagination = workoutHistoryQuerySchema.safeParse(request.query);
  if (!pagination.success) {
    const issue = pagination.error.issues[0];
    throw new ApiError(
      400,
      issue?.code === 'unrecognized_keys'
        ? 'Unexpected query parameter'
        : (issue?.message ?? 'Invalid workout history query'),
    );
  }
  const { page, limit, status } = pagination.data;
  const result = await listWorkouts(getAuthenticatedUser(request)._id, page, limit, status);
  response.status(200).json(result);
};

export const getWorkoutProgressController: RequestHandler = async (request, response) => {
  const progress = await getWorkoutProgress(getAuthenticatedUser(request)._id);
  const user = getAuthenticatedUser(request);
  response.status(200).json({
    profile: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      athleteLevel: user.athleteLevel,
      experienceYears: user.experienceYears,
      targetGoal: user.targetGoal,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
    },
    progress,
  });
};

export const getWorkoutController: RequestHandler = async (request, response) => {
  const workout = await getWorkout(
    getAuthenticatedUser(request)._id,
    request.params.workoutId as string,
  );
  response.status(200).json({ workout });
};

export const updateWorkoutSetController: RequestHandler = async (request, response) => {
  const set = await updateWorkoutSet(
    getAuthenticatedUser(request)._id,
    request.params.workoutId as string,
    request.params.setId as string,
    request.body,
  );
  response.status(200).json({ set });
};

export const completeWorkoutController: RequestHandler = async (request, response) => {
  const workout = await completeWorkout(
    getAuthenticatedUser(request)._id,
    request.params.workoutId as string,
  );
  response.status(200).json({ workout });
};

export const cancelWorkoutController: RequestHandler = async (request, response) => {
  const workout = await cancelWorkout(
    getAuthenticatedUser(request)._id,
    request.params.workoutId as string,
  );
  response.status(200).json({ workout });
};
