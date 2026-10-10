import assert from 'node:assert/strict';
import test from 'node:test';
import { settingsUpdateSchema } from '../dist/validation/authSchemas.js';

test('settings updates accept only known settings with valid values', () => {
  assert.equal(settingsUpdateSchema.safeParse({ voiceGuidance: false }).success, true);
  assert.equal(
    settingsUpdateSchema.safeParse({
      formStrictness: 'Strict',
      unitSystem: 'Imperial (lbs)',
      vibrationAlerts: false,
      emailNotifications: false,
      theme: 'dark',
    }).success,
    true,
  );
  assert.equal(settingsUpdateSchema.safeParse({}).success, false);
  assert.equal(settingsUpdateSchema.safeParse({ formStrictness: 'Extreme' }).success, false);
  assert.equal(settingsUpdateSchema.safeParse({ voiceGuidance: 'false' }).success, false);
});

test('settings updates reject ownership and unsupported-field injection', () => {
  for (const field of ['userId', 'ownerId', 'role', 'passwordHash', 'email']) {
    assert.equal(
      settingsUpdateSchema.safeParse({ voiceGuidance: false, [field]: 'unexpected' }).success,
      false,
      `${field} must be rejected`,
    );
  }
});
