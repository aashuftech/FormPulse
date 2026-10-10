import assert from 'node:assert/strict';
import test from 'node:test';
import { profileUpdateSchema } from '../dist/validation/authSchemas.js';

test('profile updates accept supported fields and reject empty or unexpected fields', () => {
  assert.equal(
    profileUpdateSchema.safeParse({
      name: 'Updated Name',
      targetGoal: 'Build Strength',
      weightKg: 82.5,
      heightCm: 181,
    }).success,
    true,
  );
  assert.equal(profileUpdateSchema.safeParse({}).success, false);
  for (const protectedField of ['userId', 'ownerId', 'role', 'email', 'passwordHash']) {
    assert.equal(
      profileUpdateSchema.safeParse({ name: 'Updated Name', [protectedField]: 'unexpected' })
        .success,
      false,
      `${protectedField} must not be accepted by the profile update endpoint`,
    );
  }
});

test('profile update schema enforces profile field constraints', () => {
  assert.equal(profileUpdateSchema.safeParse({ name: 'A' }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ targetGoal: 'Unrecognized goal' }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ weightKg: -1 }).success, false);
  assert.equal(profileUpdateSchema.safeParse({ heightCm: 301 }).success, false);
});
