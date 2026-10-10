import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateChallengeProgress,
  parseChallengeGoal,
} from '../dist/services/challengeService.js';

test('challenge goals map to supported measured workout metrics', () => {
  assert.deepEqual(parseChallengeGoal('500 Total Reps'), {
    targetValue: 500,
    metric: 'reps',
    unit: 'Total Reps',
  });
  assert.equal(parseChallengeGoal('Complete 50 sets with a form score above 90').metric, 'sets');
  assert.deepEqual(parseChallengeGoal('10 minutes'), {
    targetValue: 600,
    metric: 'durationSeconds',
    unit: 'seconds',
  });
  assert.throws(() => parseChallengeGoal('Reach a new personal best'), /numeric target|specify/);
  assert.throws(() => parseChallengeGoal('2.5 sets'), /whole numbers/);
});

test('challenge progress is independently calculated and capped at each target', () => {
  const createdAt = new Date('2026-10-01T00:00:00Z');
  const deadline = new Date('2026-10-31T23:59:59Z');
  const sets = [
    {
      completedAt: new Date('2026-10-02T00:00:00Z'),
      reps: 8,
      weightKg: 10,
      durationSeconds: 30,
      formScore: 82,
      estimatedCalories: 4,
    },
    {
      completedAt: new Date('2026-10-03T00:00:00Z'),
      reps: 5,
      weightKg: 12,
      durationSeconds: 45,
      formScore: 94,
      estimatedCalories: 6,
    },
  ];
  const sessions = [
    { completedAt: new Date('2026-10-04T00:00:00Z') },
    { completedAt: new Date('2026-10-05T00:00:00Z') },
  ];
  const progressFor = (metric, target) =>
    calculateChallengeProgress(metric, target, createdAt, deadline, sets, sessions);

  assert.equal(progressFor('reps', 20), 13);
  assert.equal(progressFor('sets', 1), 1);
  assert.equal(progressFor('workouts', 2), 2);
  assert.equal(progressFor('volumeKg', 100), 100);
  assert.equal(progressFor('calories', 20), 10);
  assert.equal(progressFor('durationSeconds', 100), 75);
  assert.equal(progressFor('formScore', 100), 94);
});

test('challenge progress excludes activity outside its creation/deadline window', () => {
  const createdAt = new Date('2026-10-10T00:00:00Z');
  const deadline = new Date('2026-10-20T00:00:00Z');
  const sets = [
    { completedAt: new Date('2026-10-09T23:59:59Z'), reps: 100 },
    { completedAt: new Date('2026-10-15T00:00:00Z'), reps: 7 },
    { completedAt: new Date('2026-10-20T00:00:01Z'), reps: 100 },
  ];

  assert.equal(calculateChallengeProgress('reps', 50, createdAt, deadline, sets, []), 7);
  assert.equal(calculateChallengeProgress('reps', 5, createdAt, deadline, sets, []), 5);
});
