import { Router, type RequestHandler } from 'express';
import {
  createChallengeController,
  deleteChallengeController,
  listChallengesController,
  updateChallengeController,
} from '../controllers/challengeController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createChallengeSchema,
  challengeParamsSchema,
  emptyChallengeQuerySchema,
  updateChallengeSchema,
} from '../validation/challengeSchemas.js';

export const challengeRoutes = Router();

const validateChallengeParams: RequestHandler = (request, _response, next) => {
  const result = challengeParamsSchema.safeParse(request.params);
  if (!result.success) {
    next(new ApiError(400, result.error.issues[0]?.message ?? 'Invalid challenge identifier'));
    return;
  }
  next();
};

challengeRoutes.use(authenticate);
challengeRoutes.get(
  '/',
  (request, _response, next) => {
    const result = emptyChallengeQuerySchema.safeParse(request.query);
    if (!result.success) {
      next(new ApiError(400, 'Unexpected query parameter'));
      return;
    }
    next();
  },
  listChallengesController,
);
challengeRoutes.post('/', validateBody(createChallengeSchema), createChallengeController);
challengeRoutes.patch(
  '/:challengeId',
  validateChallengeParams,
  validateBody(updateChallengeSchema),
  updateChallengeController,
);
challengeRoutes.delete('/:challengeId', validateChallengeParams, deleteChallengeController);
