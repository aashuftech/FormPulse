import { createContext } from 'react';
import type { WorkoutSession, WorkoutSet } from '@/types';

export interface WorkoutContextType {
  activeSession: WorkoutSession | null;
  isSessionActive: boolean;
  startSession: (title?: string) => void;
  endSession: () => void;
  addSet: (exerciseId: string, set: Omit<WorkoutSet, 'setNumber'>) => void;
  completeSet: (exerciseId: string, setIndex: number, accuracyScore?: number) => void;
  activeSeconds: number;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);
