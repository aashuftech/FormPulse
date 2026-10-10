import { useRef, useState, type ReactNode } from 'react';
import type { WorkoutSession } from '@/types';
import { MOCK_EXERCISES } from '@/services/mockData';
import { workoutService } from '@/services/workoutService';
import { WorkoutContext } from './workout-context-def';

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The workout request could not be completed.';
}

function getNextSet(session: WorkoutSession) {
  for (let exerciseIndex = 0; exerciseIndex < session.exercises.length; exerciseIndex += 1) {
    const setIndex = session.exercises[exerciseIndex].sets.findIndex(set => !set.completed);
    if (setIndex !== -1) return { exerciseIndex, setIndex };
  }
  return null;
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<WorkoutSession | null>(null);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdatingSet, setIsUpdatingSet] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeSessionRef = useRef<WorkoutSession | null>(null);
  const startingRef = useRef(false);
  const updatingRef = useRef(false);
  const completingRef = useRef(false);

  const storeSession = (session: WorkoutSession | null) => {
    activeSessionRef.current = session;
    setActiveSession(session);
  };

  const startSession = async (
    title = 'Workout Session',
    exerciseIds = MOCK_EXERCISES.map(exercise => exercise.id),
  ) => {
    if (startingRef.current || activeSessionRef.current?.status === 'in-progress') return false;
    startingRef.current = true;
    setIsStarting(true);
    setError(null);
    try {
      const session = await workoutService.start(title, exerciseIds);
      storeSession(session);
      setLastCompletedWorkout(null);
      setActiveSeconds(0);
      return true;
    } catch (requestError) {
      setError(getMessage(requestError));
      return false;
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  };

  const completeSet = async (
    exerciseId: string,
    setIndex: number,
    progress: {
      reps?: number;
      durationSeconds?: number;
      weightKg?: number;
      formScore?: number;
      activeDurationSeconds?: number;
    },
  ) => {
    const session = activeSessionRef.current;
    if (
      !session ||
      session.status !== 'in-progress' ||
      updatingRef.current ||
      completingRef.current
    )
      return false;

    const nextSet = getNextSet(session);
    const exerciseIndex = session.exercises.findIndex(item => item.exerciseId === exerciseId);
    const exerciseItem = session.exercises[exerciseIndex];
    const set = exerciseItem?.sets[setIndex];
    if (!set || !set.id) {
      setError('This workout set is unavailable. Refresh the workout and try again.');
      return false;
    }
    if (!nextSet || nextSet.exerciseIndex !== exerciseIndex || nextSet.setIndex !== setIndex) {
      setError('Complete the current set before moving to the next one.');
      return false;
    }

    const target = exerciseItem.exercise;
    if (
      progress.formScore !== undefined &&
      (!Number.isFinite(progress.formScore) || progress.formScore < 0 || progress.formScore > 100)
    ) {
      setError('The form score must be between 0 and 100.');
      return false;
    }
    if (target.trackingType === 'duration') {
      const seconds = progress.durationSeconds;
      if (!Number.isInteger(seconds) || !seconds || seconds > (target.targetDurationSeconds ?? 0)) {
        setError(`Enter a duration from 1 to ${target.targetDurationSeconds} seconds.`);
        return false;
      }
    } else {
      const reps = progress.reps;
      if (!Number.isInteger(reps) || !reps || reps > target.targetRepsDefault) {
        setError(`Enter reps from 1 to ${target.targetRepsDefault}.`);
        return false;
      }
    }

    updatingRef.current = true;
    setIsUpdatingSet(true);
    setError(null);
    try {
      const savedSet = await workoutService.updateSet(session.id, set.id, {
        ...(target.trackingType === 'duration'
          ? { durationSeconds: progress.durationSeconds }
          : { reps: progress.reps }),
        ...(progress.activeDurationSeconds === undefined
          ? {}
          : { activeDurationSeconds: progress.activeDurationSeconds }),
        ...(progress.weightKg === undefined ? {} : { weightKg: progress.weightKg }),
        ...(progress.formScore === undefined ? {} : { formScore: progress.formScore }),
        completed: true,
      });
      const updatedSession: WorkoutSession = {
        ...session,
        exercises: session.exercises.map(item =>
          item.exerciseId === exerciseId
            ? {
                ...item,
                sets: item.sets.map((existingSet, index) =>
                  index === setIndex ? savedSet : existingSet,
                ),
              }
            : item,
        ),
      };
      storeSession(updatedSession);
      return true;
    } catch (requestError) {
      try {
        storeSession(await workoutService.getById(session.id));
      } catch {
        // Preserve the last known state when the server cannot be reached for reconciliation.
      }
      setError(getMessage(requestError));
      return false;
    } finally {
      updatingRef.current = false;
      setIsUpdatingSet(false);
    }
  };

  const completeWorkout = async () => {
    const session = activeSessionRef.current;
    if (
      !session ||
      session.status !== 'in-progress' ||
      completingRef.current ||
      updatingRef.current
    )
      return false;
    if (getNextSet(session)) {
      setError('Complete every set before finishing this workout.');
      return false;
    }

    completingRef.current = true;
    setIsCompleting(true);
    setError(null);
    try {
      const completed = await workoutService.complete(session.id);
      setLastCompletedWorkout(completed);
      storeSession(null);
      setActiveSeconds(0);
      return true;
    } catch (requestError) {
      try {
        const current = await workoutService.getById(session.id);
        if (current.status === 'completed') {
          setLastCompletedWorkout(current);
          storeSession(null);
          setActiveSeconds(0);
          return true;
        }
      } catch {
        // Keep the active session when completion cannot be confirmed.
      }
      setError(getMessage(requestError));
      return false;
    } finally {
      completingRef.current = false;
      setIsCompleting(false);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeSession,
        lastCompletedWorkout,
        isSessionActive: activeSession?.status === 'in-progress',
        isStarting,
        isUpdatingSet,
        isCompleting,
        error,
        startSession,
        completeWorkout,
        completeSet,
        activeSeconds,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}
