import { Router, type RequestHandler } from 'express';
import {
  cancelWorkoutController,
  completeWorkoutController,
  getWorkoutController,
  getWorkoutProgressController,
  listWorkoutsController,
  startWorkoutController,
  updateWorkoutSetController,
} from '../controllers/workoutController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { ApiError } from '../utils/ApiError.js';
import {
  completeWorkoutSchema,
  startWorkoutSchema,
  updateWorkoutSetSchema,
  workoutParamsSchema,
} from '../validation/workoutSchemas.js';

export const workoutRoutes = Router();

const validateWorkoutParams: RequestHandler = (request, _response, next) => {
  const result = workoutParamsSchema.safeParse(request.params);
  if (!result.success) {
    next(new ApiError(400, result.error.issues[0]?.message ?? 'Invalid workout identifier'));
    return;
  }
  next();
};

workoutRoutes.use(authenticate);
workoutRoutes.get('/', listWorkoutsController);
workoutRoutes.get('/progress', getWorkoutProgressController);
workoutRoutes.post('/', validateBody(startWorkoutSchema), startWorkoutController);
workoutRoutes.get('/:workoutId', validateWorkoutParams, getWorkoutController);
workoutRoutes.patch(
  '/:workoutId/sets/:setId',
  validateWorkoutParams,
  validateBody(updateWorkoutSetSchema),
  updateWorkoutSetController,
);
workoutRoutes.post(
  '/:workoutId/complete',
  validateWorkoutParams,
  validateBody(completeWorkoutSchema),
  completeWorkoutController,
);
workoutRoutes.delete('/:workoutId', validateWorkoutParams, cancelWorkoutController);
