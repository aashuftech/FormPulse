import { useContext } from 'react';
import { WorkoutContext, type WorkoutContextType } from '@/context/workout-context-def';

export function useWorkout(): WorkoutContextType {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
