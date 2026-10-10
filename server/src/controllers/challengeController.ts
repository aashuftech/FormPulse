import type { RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/authorization.js';
import {
  createChallenge,
  deleteChallenge,
  listChallenges,
  updateChallenge,
} from '../services/challengeService.js';

export const createChallengeController: RequestHandler = async (request, response) => {
  const challenge = await createChallenge(getAuthenticatedUser(request)._id, request.body);
  response.status(201).json({ challenge });
};

export const listChallengesController: RequestHandler = async (request, response) => {
  const challenges = await listChallenges(getAuthenticatedUser(request)._id);
  response.status(200).json({ challenges });
};

export const updateChallengeController: RequestHandler = async (request, response) => {
  const challenge = await updateChallenge(
    getAuthenticatedUser(request)._id,
    request.params.challengeId as string,
    request.body,
  );
  response.status(200).json({ challenge });
};

export const deleteChallengeController: RequestHandler = async (request, response) => {
  await deleteChallenge(getAuthenticatedUser(request)._id, request.params.challengeId as string);
  response.status(204).end();
};
