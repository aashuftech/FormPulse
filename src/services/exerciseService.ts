import type { Exercise, MuscleGroup } from '@/types';
import { MOCK_EXERCISES } from './mockData';

export const exerciseService = {
  async getAll(): Promise<Exercise[]> {
    return Promise.resolve([...MOCK_EXERCISES]);
  },

  async getById(id: string): Promise<Exercise | undefined> {
    return Promise.resolve(MOCK_EXERCISES.find(e => e.id === id));
  },

  async filterByMuscle(muscle: MuscleGroup | 'All'): Promise<Exercise[]> {
    if (muscle === 'All') return this.getAll();
    return Promise.resolve(
      MOCK_EXERCISES.filter(
        e => e.muscleGroup === muscle || e.secondaryMuscles?.includes(muscle as MuscleGroup),
      ),
    );
  },
};
