import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { app } from '../dist/app.js';
import { RefreshSession } from '../dist/models/RefreshSession.js';
import { User } from '../dist/models/User.js';

function start(serverApp) {
  const server = serverApp.listen(0, '127.0.0.1');
  return new Promise(resolve => server.once('listening', () => resolve(server)));
}

function cookiesFrom(response) {
  return (response.headers.getSetCookie?.() ?? []).map(value => value.split(';')[0]).join('; ');
}

async function request(baseUrl, path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    status: response.status,
    body: await response.json().catch(() => ({})),
    cookie: cookiesFrom(response),
  };
}

test('user settings persist per authenticated account across login sessions', async () => {
  assert.ok(process.env.MONGODB_URI, 'MONGODB_URI is required for settings integration tests');
  await mongoose.connect(process.env.MONGODB_URI);

  const suffix = randomUUID();
  const password = `SettingsTestAa1!${suffix}`;
  const passwordHash = await bcrypt.hash(password, 4);
  const users = await User.create([
    {
      name: 'Settings Test User A',
      email: `settings-a-${suffix}@example.invalid`,
      passwordHash,
      emailVerified: true,
    },
    {
      name: 'Settings Test User B',
      email: `settings-b-${suffix}@example.invalid`,
      passwordHash,
      emailVerified: true,
    },
  ]);
  const [userA, userB] = users;
  const server = await start(app);
  const apiUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const unauthenticated = await request(apiUrl, '/api/auth/settings', {
      method: 'PATCH',
      body: { voiceGuidance: false },
    });
    assert.equal(unauthenticated.status, 401);

    const loginA = await request(apiUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userA.email, password },
    });
    const loginB = await request(apiUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userB.email, password },
    });
    assert.equal(loginA.status, 200);
    assert.equal(loginB.status, 200);

    const defaults = await request(apiUrl, '/api/auth/settings', { cookie: loginA.cookie });
    assert.equal(defaults.status, 200);
    assert.deepEqual(defaults.body.settings, {
      voiceGuidance: true,
      vibrationAlerts: true,
      formStrictness: 'Standard',
      unitSystem: 'Metric (kg)',
      emailNotifications: true,
      theme: 'dark',
    });

    const updated = await request(apiUrl, '/api/auth/settings', {
      method: 'PATCH',
      cookie: loginA.cookie,
      body: { voiceGuidance: false, formStrictness: 'Relaxed', unitSystem: 'Imperial (lbs)' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.settings.voiceGuidance, false);
    assert.equal(updated.body.settings.formStrictness, 'Relaxed');
    assert.equal(updated.body.settings.unitSystem, 'Imperial (lbs)');

    const refreshedA = await request(apiUrl, '/api/auth/settings', { cookie: loginA.cookie });
    assert.deepEqual(refreshedA.body.settings, updated.body.settings);
    assert.deepEqual(
      (await User.findById(userA._id).select('settings').lean()).settings,
      updated.body.settings,
      'settings are stored on the authenticated user document',
    );
    const unchangedB = await request(apiUrl, '/api/auth/settings', { cookie: loginB.cookie });
    assert.equal(unchangedB.body.settings.voiceGuidance, true);
    assert.equal(unchangedB.body.settings.formStrictness, 'Standard');

    for (const body of [
      { voiceGuidance: false, userId: String(userB._id) },
      { voiceGuidance: false, ownerId: String(userB._id) },
      { role: 'admin' },
      { formStrictness: 'Extreme' },
      {},
    ]) {
      const invalid = await request(apiUrl, '/api/auth/settings', {
        method: 'PATCH',
        cookie: loginA.cookie,
        body,
      });
      assert.equal(invalid.status, 400);
    }

    const loggedOut = await request(apiUrl, '/api/auth/logout', {
      method: 'POST',
      cookie: loginA.cookie,
      body: {},
    });
    assert.equal(loggedOut.status, 200);
    const loginAgain = await request(apiUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userA.email, password },
    });
    const afterLogin = await request(apiUrl, '/api/auth/settings', { cookie: loginAgain.cookie });
    assert.deepEqual(afterLogin.body.settings, updated.body.settings);
  } finally {
    try {
      await Promise.all([
        RefreshSession.deleteMany({ userId: { $in: [userA._id, userB._id] } }),
        User.deleteMany({ _id: { $in: [userA._id, userB._id] } }),
      ]);
      assert.equal(await User.countDocuments({ _id: { $in: [userA._id, userB._id] } }), 0);
      assert.equal(
        await RefreshSession.countDocuments({ userId: { $in: [userA._id, userB._id] } }),
        0,
      );
    } finally {
      await new Promise(resolve => server.close(resolve));
      await mongoose.disconnect();
    }
  }
});
