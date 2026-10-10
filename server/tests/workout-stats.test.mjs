import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateWorkoutProgress, createWorkoutSummary } from '../dist/services/workoutStats.js';

test('workout summary derives completed exercises, sets, reps, plank time and saved metrics', () => {
  const summary = createWorkoutSummary(
    {
      durationSeconds: 900,
      estimatedCalories: 42,
      averageFormScore: 91,
      totalVolumeKg: 1800,
    },
    [
      { exerciseId: 'ex_squats', reps: 12, completed: true },
      { exerciseId: 'ex_squats', reps: 10, completed: true },
      { exerciseId: 'ex_plank', durationSeconds: 45, completed: true },
    ],
  );
  assert.deepEqual(summary, {
    exercisesCompleted: 2,
    totalSets: 3,
    totalReps: 22,
    plankDurationSeconds: 45,
    durationSeconds: 900,
    estimatedCalories: 42,
    averageFormScore: 91,
    totalVolumeKg: 1800,
  });
});

test('progress aggregates authenticated completed-session metrics and personal records', () => {
  const result = calculateWorkoutProgress(
    [
      {
        durationSeconds: 600,
        startedAt: '2026-09-01T10:00:00.000Z',
        completedAt: '2026-09-01T10:10:00.000Z',
        averageFormScore: 88,
        estimatedCalories: 10,
        totalVolumeKg: 600,
      },
      {
        durationSeconds: 300,
        startedAt: '2026-09-02T10:00:00.000Z',
        completedAt: '2026-09-02T10:05:00.000Z',
        averageFormScore: 99,
        estimatedCalories: 3,
        totalVolumeKg: 0,
      },
    ],
    [
      {
        exerciseId: 'ex_squats',
        exerciseName: 'Squats',
        completed: true,
        reps: 12,
        estimatedCalories: 10,
        formScore: 88,
        weightKg: 50,
      },
      {
        exerciseId: 'ex_plank',
        exerciseName: 'Plank',
        completed: true,
        durationSeconds: 60,
        estimatedCalories: 3,
        formScore: 99,
      },
    ],
  );

  assert.equal(result.totalWorkouts, 2);
  assert.equal(result.totalReps, 12);
  assert.equal(result.totalWorkoutTimeSeconds, 900);
  assert.equal(result.totalEstimatedCalories, 13);
  assert.equal(result.personalRecords.highestRepsPerSet, 12);
  assert.equal(result.personalRecords.longestPlankSeconds, 60);
  assert.equal(result.personalRecords.bestFormScore, 99);
  assert.equal(result.personalRecords.highestWeightKg, 50);
  assert.equal(result.personalRecords.highestSetVolumeKg, 600);
  assert.equal(result.personalRecords.highestWorkoutVolumeKg, 600);
  assert.equal(result.exerciseProgress.length, 2);
  assert.equal(result.weeklyProgress.length, 1);
  assert.equal(result.weeklyProgress[0].workoutCount, 2);
});

test('progress does not claim a calorie total when any completed session lacks estimates', () => {
  const result = calculateWorkoutProgress(
    [{ durationSeconds: 60, estimatedCalories: 4 }, { durationSeconds: 90 }],
    [{ exerciseId: 'ex_squats', reps: 10, estimatedCalories: 4 }],
  );
  assert.equal('totalEstimatedCalories' in result, false);
});
