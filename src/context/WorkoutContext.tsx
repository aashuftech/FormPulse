import { useState, type ReactNode } from 'react';
import type { WorkoutSession, WorkoutSet } from '@/types';
import { WorkoutContext } from './workout-context-def';

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const startSession = (title = 'Workout Session') => {
    setActiveSession({
      id: `wk_active_${Date.now()}`,
      title,
      startTime: new Date().toISOString(),
      durationMinutes: 0,
      exercises: [],
      status: 'in-progress',
      averageFormScore: 0,
      caloriesBurned: 0,
      totalVolumeKg: 0,
    });
    setActiveSeconds(0);
  };

  const endSession = () => {
    setActiveSession(null);
    setActiveSeconds(0);
  };

  const addSet = (exerciseId: string, set: Omit<WorkoutSet, 'setNumber'>) => {
    if (!activeSession) return;
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(item => {
          if (item.exerciseId === exerciseId) {
            const newSetNumber = item.sets.length + 1;
            return {
              ...item,
              sets: [...item.sets, { ...set, setNumber: newSetNumber }],
            };
          }
          return item;
        }),
      };
    });
  };

  const completeSet = (exerciseId: string, setIndex: number, accuracyScore?: number) => {
    if (!activeSession) return;
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(item => {
          if (item.exerciseId === exerciseId) {
            const updatedSets = [...item.sets];
            if (updatedSets[setIndex]) {
              updatedSets[setIndex] = {
                ...updatedSets[setIndex],
                completed: true,
                ...(accuracyScore === undefined ? {} : { accuracyScore }),
              };
            }
            return { ...item, sets: updatedSets };
          }
          return item;
        }),
      };
    });
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeSession,
        isSessionActive: !!activeSession,
        startSession,
        endSession,
        addSet,
        completeSet,
        activeSeconds,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}
