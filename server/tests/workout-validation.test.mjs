import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeWorkoutSchema,
  startWorkoutSchema,
  updateWorkoutSetSchema,
  workoutHistoryQuerySchema,
  workoutParamsSchema,
} from '../dist/validation/workoutSchemas.js';

test('workout request schemas support the MVP reps and duration exercises', () => {
  assert.equal(
    startWorkoutSchema.safeParse({
      title: 'Strength session',
      exercises: [{ exerciseId: 'ex_squats', setCount: 3 }],
    }).success,
    true,
  );
  assert.equal(
    startWorkoutSchema.safeParse({
      title: 'Core session',
      exercises: [{ exerciseId: 'ex_plank', setCount: 2 }],
    }).success,
    true,
  );
  assert.equal(updateWorkoutSetSchema.safeParse({ durationSeconds: 45 }).success, true);
  assert.equal(updateWorkoutSetSchema.safeParse({ activeDurationSeconds: 60 }).success, true);
  assert.equal(
    updateWorkoutSetSchema.safeParse({ reps: 12, estimatedCalories: 99 }).success,
    false,
    'calorie estimates are calculated by the server, not accepted from clients',
  );
});

test('workout request schemas reject ownership injection, invalid IDs, and unsafe pagination', () => {
  assert.equal(
    startWorkoutSchema.safeParse({
      title: 'Injected session',
      userId: '507f1f77bcf86cd799439011',
      exercises: [{ exerciseId: 'ex_squats', setCount: 1 }],
    }).success,
    false,
  );
  assert.equal(startWorkoutSchema.safeParse({ workoutId: 'not-an-object-id' }).success, false);
  assert.equal(workoutParamsSchema.safeParse({ workoutId: 'not-an-object-id' }).success, false);
  assert.equal(workoutHistoryQuerySchema.safeParse({ limit: '101' }).success, false);
  assert.equal(workoutHistoryQuerySchema.safeParse({ page: '0' }).success, false);
  assert.equal(completeWorkoutSchema.safeParse({ ownerId: 'attacker' }).success, false);
});

test('workout history pagination defaults and limits are bounded', () => {
  assert.deepEqual(workoutHistoryQuerySchema.parse({}), {
    page: 1,
    limit: 20,
    status: 'completed',
  });
  assert.deepEqual(workoutHistoryQuerySchema.parse({ page: '2', limit: '100' }), {
    page: 2,
    limit: 100,
    status: 'completed',
  });
});
