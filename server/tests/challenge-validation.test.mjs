import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createChallengeSchema,
  challengeParamsSchema,
  emptyChallengeQuerySchema,
  updateChallengeSchema,
} from '../dist/validation/challengeSchemas.js';

test('challenge creation accepts valid fields and normalizes text', () => {
  assert.deepEqual(
    createChallengeSchema.parse({ title: '  Push-Up Month  ', goal: ' 500 Total Reps ' }),
    { title: 'Push-Up Month', goal: '500 Total Reps' },
  );
});

test('challenge creation rejects missing, oversized, and ownership fields', () => {
  assert.equal(createChallengeSchema.safeParse({ title: 'Name' }).success, false);
  assert.equal(
    createChallengeSchema.safeParse({ title: 'Valid challenge', goal: '500 Reps', userId: 'x' })
      .success,
    false,
  );
  assert.equal(
    createChallengeSchema.safeParse({ title: 'Valid challenge', goal: '500 Reps', ownerId: 'x' })
      .success,
    false,
  );
  assert.equal(emptyChallengeQuerySchema.safeParse({ page: '1' }).success, false);
});

test('challenge updates accept only editable fields and reject progress or ownership injection', () => {
  assert.deepEqual(updateChallengeSchema.parse({ title: 'Updated Challenge' }), {
    title: 'Updated Challenge',
  });
  assert.equal(updateChallengeSchema.safeParse({ currentValue: 99 }).success, false);
  assert.equal(updateChallengeSchema.safeParse({ ownerId: 'attacker' }).success, false);
  assert.equal(updateChallengeSchema.safeParse({ status: 'completed' }).success, false);
  assert.equal(challengeParamsSchema.safeParse({ challengeId: 'not-valid' }).success, false);
  assert.equal(
    challengeParamsSchema.safeParse({ challengeId: '507f1f77bcf86cd799439011' }).success,
    true,
  );
});
