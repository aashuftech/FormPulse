import { useState, type ReactNode } from 'react';
import type { WorkoutSession, WorkoutExerciseItem, WorkoutSet } from '@/types';
import { MOCK_EXERCISES } from '@/services/mockData';
import { WorkoutContext } from './workout-context-def';

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const startSession = (title = 'Hypertrophy Alpha Routine') => {
    const initialExercises: WorkoutExerciseItem[] = [
      {
        exerciseId: MOCK_EXERCISES[0].id,
        exercise: MOCK_EXERCISES[0],
        sets: [
          { setNumber: 1, reps: 8, weightKg: 100, completed: false },
          { setNumber: 2, reps: 8, weightKg: 100, completed: false },
          { setNumber: 3, reps: 8, weightKg: 100, completed: false },
        ],
      },
      {
        exerciseId: MOCK_EXERCISES[1].id,
        exercise: MOCK_EXERCISES[1],
        sets: [
          { setNumber: 1, reps: 10, weightKg: 32, completed: false },
          { setNumber: 2, reps: 10, weightKg: 32, completed: false },
          { setNumber: 3, reps: 8, weightKg: 34, completed: false },
        ],
      },
    ];

    setActiveSession({
      id: `wk_active_${Date.now()}`,
      title,
      startTime: new Date().toISOString(),
      durationMinutes: 0,
      exercises: initialExercises,
      status: 'in-progress',
      averageFormScore: 95,
      caloriesBurned: 120,
      totalVolumeKg: 3240,
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

  const completeSet = (exerciseId: string, setIndex: number, accuracyScore = 95) => {
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
                accuracyScore,
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
