import { createContext } from 'react';
import type { WorkoutSession } from '@/types';

export interface WorkoutContextType {
  activeSession: WorkoutSession | null;
  lastCompletedWorkout: WorkoutSession | null;
  isSessionActive: boolean;
  isStarting: boolean;
  isUpdatingSet: boolean;
  isCompleting: boolean;
  error: string | null;
  startSession: (title?: string, exerciseIds?: string[]) => Promise<boolean>;
  completeWorkout: () => Promise<boolean>;
  completeSet: (
    exerciseId: string,
    setIndex: number,
    progress: {
      reps?: number;
      durationSeconds?: number;
      weightKg?: number;
      formScore?: number;
      activeDurationSeconds?: number;
    },
  ) => Promise<boolean>;
  activeSeconds: number;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);
