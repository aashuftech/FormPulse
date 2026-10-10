import type { Challenge } from '@/types';
import { authenticatedRequest } from './authApi';

interface ChallengeResponse {
  challenge: Challenge;
}

interface ChallengeListResponse {
  challenges: Challenge[];
}

export const challengeService = {
  async list(): Promise<Challenge[]> {
    const response = await authenticatedRequest<ChallengeListResponse>('/challenges');
    return response.challenges;
  },

  async create(title: string, goal: string): Promise<Challenge> {
    const response = await authenticatedRequest<ChallengeResponse>('/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, goal }),
    });
    return response.challenge;
  },

  async update(id: string, updates: { title?: string; goal?: string }): Promise<Challenge> {
    const response = await authenticatedRequest<ChallengeResponse>(`/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.challenge;
  },

  async remove(id: string): Promise<void> {
    await authenticatedRequest<void>(`/challenges/${id}`, { method: 'DELETE' });
  },
};
