import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import { app } from '../dist/app.js';
import { authenticate } from '../dist/middleware/authenticate.js';
import { requireAdmin } from '../dist/middleware/authorization.js';
import { errorHandler } from '../dist/middleware/errorHandler.js';
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

test('authorization, ownership, and IDOR protections use persisted roles and sessions', async () => {
  assert.ok(
    process.env.MONGODB_URI,
    'MONGODB_URI must be configured for the authorization integration test',
  );
  await mongoose.connect(process.env.MONGODB_URI);

  const suffix = randomUUID();
  const password = `SecureAa1!${suffix}`;
  const passwordHash = await bcrypt.hash(password, 4);
  const userEmail = `authorization-user-${suffix}@example.invalid`;
  const adminEmail = `authorization-admin-${suffix}@example.invalid`;
  const user = await User.create({
    name: 'Authorization Test User',
    email: userEmail,
    passwordHash,
    emailVerified: true,
    role: 'user',
  });
  const admin = await User.create({
    name: 'Authorization Test Admin',
    email: adminEmail,
    passwordHash,
    emailVerified: true,
    role: 'admin',
  });

  const adminProbe = express();
  adminProbe.use(express.json(), cookieParser());
  adminProbe.get('/admin-only', authenticate, requireAdmin, (_request, response) => {
    response.status(200).json({ allowed: true });
  });
  adminProbe.use(errorHandler);

  const [apiServer, probeServer] = await Promise.all([start(app), start(adminProbe)]);
  const apiUrl = `http://127.0.0.1:${apiServer.address().port}`;
  const probeUrl = `http://127.0.0.1:${probeServer.address().port}`;
  let testCount = 0;

  try {
    let result = await request(apiUrl, '/api/auth/sessions');
    assert.equal(result.status, 401, 'unauthenticated session access is rejected');
    result = await request(probeUrl, '/admin-only');
    assert.equal(result.status, 401, 'admin route requires authentication');
    testCount += 2;

    const userLogin = await request(apiUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userEmail, password },
    });
    assert.equal(userLogin.status, 200);
    let userCookie = userLogin.cookie;
    const adminLogin = await request(apiUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password },
    });
    assert.equal(adminLogin.status, 200);
    const adminCookie = adminLogin.cookie;
    testCount += 2;

    result = await request(apiUrl, '/api/auth/me', {
      method: 'PATCH',
      cookie: userCookie,
      body: {
        name: 'Updated Authorization User',
        targetGoal: 'Build Strength',
        weightKg: 82.5,
        heightCm: 181,
      },
    });
    assert.equal(result.status, 200, 'authenticated users can update their own profile');
    assert.equal(result.body.user.name, 'Updated Authorization User');
    assert.equal(result.body.user.weightKg, 82.5);
    assert.equal(result.body.user.heightCm, 181);
    assert.equal(result.body.user.targetGoal, 'Build Strength');
    assert.equal('passwordHash' in result.body.user, false);
    result = await request(apiUrl, '/api/auth/me', { cookie: userCookie });
    assert.equal(result.body.user.name, 'Updated Authorization User');
    result = await request(apiUrl, '/api/auth/me', {
      method: 'PATCH',
      cookie: userCookie,
      body: { name: 'Injected update', userId: String(admin._id) },
    });
    assert.equal(result.status, 400, 'profile updates reject user ownership fields');
    assert.equal(
      (await User.findById(admin._id).select('name').lean()).name,
      'Authorization Test Admin',
    );
    const refreshed = await request(apiUrl, '/api/auth/refresh', {
      method: 'POST',
      cookie: userCookie,
    });
    assert.equal(refreshed.status, 200, 'refresh flow remains available after profile changes');
    userCookie = refreshed.cookie;
    result = await request(apiUrl, '/api/auth/me', { cookie: userCookie });
    assert.equal(result.body.user.name, 'Updated Authorization User');
    testCount += 11;

    result = await request(apiUrl, '/api/auth/me', { cookie: userCookie });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.role, 'user', 'me exposes the safe persisted user role');
    result = await request(apiUrl, `/api/auth/me?userId=${admin.id}`, { cookie: userCookie });
    assert.equal(
      result.body.user.email,
      userEmail,
      'me ignores user IDs supplied in the query string',
    );
    const ownSession = (await request(apiUrl, '/api/auth/sessions', { cookie: userCookie })).body
      .sessions[0];
    result = await request(apiUrl, '/api/auth/sessions?page=1&limit=1', { cookie: userCookie });
    assert.equal(result.status, 200);
    assert.equal(result.body.page, 1);
    assert.equal(result.body.limit, 1);
    assert.ok(result.body.sessions.length <= 1, 'session listing respects the requested page size');
    result = await request(apiUrl, '/api/auth/sessions?limit=101', { cookie: userCookie });
    assert.equal(result.status, 400, 'session page size cannot exceed the configured maximum');
    result = await request(apiUrl, '/api/auth/sessions?page=0', { cookie: userCookie });
    assert.equal(result.status, 400, 'session page number must be positive');
    const adminSession = (await request(apiUrl, '/api/auth/sessions', { cookie: adminCookie })).body
      .sessions[0];
    assert.ok(ownSession?.sessionId, 'user can read their own session resource');
    assert.ok(adminSession?.sessionId);
    assert.notEqual(ownSession.sessionId, adminSession.sessionId);
    testCount += 11;

    result = await request(apiUrl, '/api/auth/sessions', { cookie: userCookie });
    assert.ok(result.body.sessions.every(session => session.sessionId !== adminSession.sessionId));
    result = await request(apiUrl, `/api/auth/sessions/${adminSession.sessionId}`, {
      method: 'DELETE',
      cookie: userCookie,
      body: { userId: admin.id, ownerId: admin.id },
    });
    assert.equal(result.status, 404, 'owner fields in the body cannot access another user session');
    result = await request(apiUrl, '/api/auth/sessions/not-an-object-id', {
      method: 'DELETE',
      cookie: userCookie,
    });
    assert.equal(result.status, 400, 'invalid MongoDB IDs are rejected before database queries');
    result = await request(probeUrl, '/admin-only', { cookie: userCookie });
    assert.equal(result.status, 403, 'normal user cannot access an admin-only route');
    result = await request(probeUrl, '/admin-only', { cookie: adminCookie });
    assert.equal(result.status, 200, 'admin role is checked server-side');
    const adminMe = await request(apiUrl, '/api/auth/me', { cookie: adminCookie });
    assert.equal(adminMe.body.user.role, 'admin');
    testCount += 3;

    result = await request(apiUrl, `/api/auth/sessions/${ownSession.sessionId}`, {
      method: 'DELETE',
      cookie: userCookie,
    });
    assert.equal(result.status, 200, 'user can revoke their own session');
    testCount += 4;

    result = await request(apiUrl, '/api/auth/logout', {
      method: 'POST',
      cookie: userCookie,
      body: {},
    });
    assert.equal(result.status, 200, 'logout revokes the refresh session');
    result = await request(apiUrl, '/api/auth/me', { cookie: userCookie });
    assert.equal(result.status, 401, 'logout invalidates authenticated requests');
    testCount += 2;

    for (const protectedField of ['role', 'userId', 'ownerId']) {
      const registration = await request(apiUrl, '/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Escalation Attempt',
          email: `escalation-${protectedField}-${suffix}@example.invalid`,
          password,
          targetGoal: 'Build Muscle',
          [protectedField]: protectedField === 'role' ? 'admin' : admin.id,
        },
      });
      assert.equal(
        registration.status,
        400,
        `${protectedField} cannot be supplied during registration`,
      );
    }
    assert.equal(await User.exists({ email: `escalation-role-${suffix}@example.invalid` }), null);
    assert.equal(user.role, 'user', 'self-promotion did not change the persisted role');
    testCount += 5;
  } finally {
    try {
      await Promise.all([
        RefreshSession.deleteMany({ userId: { $in: [user._id, admin._id] } }),
        User.deleteMany({ _id: { $in: [user._id, admin._id] } }),
      ]);
      assert.equal(await User.countDocuments({ _id: { $in: [user._id, admin._id] } }), 0);
      assert.equal(
        await RefreshSession.countDocuments({ userId: { $in: [user._id, admin._id] } }),
        0,
      );
    } finally {
      await Promise.all([
        new Promise(resolve => apiServer.close(resolve)),
        new Promise(resolve => probeServer.close(resolve)),
      ]);
      await mongoose.disconnect();
    }
  }

  console.log(
    `Authorization integration test passed (${testCount} checks); temporary data was removed.`,
  );
});
