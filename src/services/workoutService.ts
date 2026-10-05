import type { WorkoutSession } from '@/types';
import { MOCK_WORKOUT_HISTORY } from './mockData';

export const workoutService = {
  async getHistory(): Promise<WorkoutSession[]> {
    return Promise.resolve([...MOCK_WORKOUT_HISTORY]);
  },

  async getById(id: string): Promise<WorkoutSession | undefined> {
    return Promise.resolve(MOCK_WORKOUT_HISTORY.find(w => w.id === id));
  },

  async getLatestSession(): Promise<WorkoutSession | undefined> {
    return Promise.resolve(MOCK_WORKOUT_HISTORY[0]);
  },

  async getMetricsSummary() {
    return Promise.resolve({
      totalWorkouts: 48,
      totalVolumeKg: 342500,
      avgFormScore: 94.8,
      totalTimeMinutes: 2840,
      caloriesBurned: 24800,
    });
  },
};
