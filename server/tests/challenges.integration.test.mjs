import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { app } from '../dist/app.js';
import { Challenge } from '../dist/models/Challenge.js';
import { RefreshSession } from '../dist/models/RefreshSession.js';
import { User } from '../dist/models/User.js';
import { WorkoutSession } from '../dist/models/WorkoutSession.js';
import { WorkoutSet } from '../dist/models/WorkoutSet.js';
import { UserProgress } from '../dist/models/UserProgress.js';

function start(serverApp) {
  const server = serverApp.listen(0, '127.0.0.1');
  return new Promise(resolve => server.once('listening', () => resolve(server)));
}

function cookieFrom(response) {
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
    cookie: cookieFrom(response),
  };
}

test('challenges persist per user, support owned CRUD, and track completed workout progress', async () => {
  assert.ok(
    process.env.MONGODB_URI,
    'MONGODB_URI must be configured for the challenge integration test',
  );
  await mongoose.connect(process.env.MONGODB_URI);

  const suffix = randomUUID();
  const password = `ChallengeAa1!${suffix}`;
  const passwordHash = await bcrypt.hash(password, 4);
  let userA;
  let userB;
  let server;
  try {
    userA = await User.create({
      name: 'Challenge Test A',
      email: `challenge-a-${suffix}@example.invalid`,
      passwordHash,
      emailVerified: true,
    });
    userB = await User.create({
      name: 'Challenge Test B',
      email: `challenge-b-${suffix}@example.invalid`,
      passwordHash,
      emailVerified: true,
    });
    server = await start(app);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    let result = await request(baseUrl, '/api/challenges');
    assert.equal(result.status, 401);
    const loginA = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userA.email, password },
    });
    const loginB = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userB.email, password },
    });
    assert.equal(loginA.status, 200);
    assert.equal(loginB.status, 200);

    result = await request(baseUrl, '/api/challenges', {
      method: 'POST',
      cookie: loginA.cookie,
      body: { title: 'Push-Up Month', goal: '500 Total Reps' },
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.challenge.title, 'Push-Up Month');
    assert.equal(result.body.challenge.targetValue, 500);
    assert.equal(result.body.challenge.unit, 'Total Reps');
    assert.equal(result.body.challenge.metric, 'reps');
    assert.equal('userId' in result.body.challenge, false);
    const createdChallengeId = result.body.challenge.id;

    const setsChallenge = await request(baseUrl, '/api/challenges', {
      method: 'POST',
      cookie: loginA.cookie,
      body: { title: 'Complete Two Sets', goal: '2 total sets' },
    });
    const workoutsChallenge = await request(baseUrl, '/api/challenges', {
      method: 'POST',
      cookie: loginA.cookie,
      body: { title: 'Complete One Workout', goal: '1 workout' },
    });
    const volumeChallenge = await request(baseUrl, '/api/challenges', {
      method: 'POST',
      cookie: loginA.cookie,
      body: { title: 'Lift Fifty Kilograms', goal: '50 kg total volume' },
    });
    assert.equal(setsChallenge.status, 201);
    assert.equal(workoutsChallenge.status, 201);
    assert.equal(volumeChallenge.status, 201);

    const updateOwn = await request(baseUrl, `/api/challenges/${setsChallenge.body.challenge.id}`, {
      method: 'PATCH',
      cookie: loginA.cookie,
      body: { title: 'Complete Two Workout Sets' },
    });
    assert.equal(updateOwn.status, 200);
    assert.equal(updateOwn.body.challenge.title, 'Complete Two Workout Sets');
    const ownerIdInjection = await request(
      baseUrl,
      `/api/challenges/${setsChallenge.body.challenge.id}`,
      { method: 'PATCH', cookie: loginA.cookie, body: { userId: String(userB._id) } },
    );
    assert.equal(ownerIdInjection.status, 400);
    const progressInjection = await request(
      baseUrl,
      `/api/challenges/${setsChallenge.body.challenge.id}`,
      { method: 'PATCH', cookie: loginA.cookie, body: { currentValue: 2, status: 'completed' } },
    );
    assert.equal(progressInjection.status, 400);
    const invalidId = await request(baseUrl, '/api/challenges/not-an-object-id', {
      method: 'PATCH',
      cookie: loginA.cookie,
      body: { title: 'Attempt' },
    });
    assert.equal(invalidId.status, 400);

    const workout = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: loginA.cookie,
      body: {
        title: 'Challenge Progress Test',
        exercises: [{ exerciseId: 'ex_squats', setCount: 1 }],
      },
    });
    assert.equal(workout.status, 201);
    const set = workout.body.workout.sets[0];
    const updateSet = await request(
      baseUrl,
      `/api/workouts/${workout.body.workout.id}/sets/${set.id}`,
      {
        method: 'PATCH',
        cookie: loginA.cookie,
        body: { reps: 6, weightKg: 10, formScore: 92, completed: true },
      },
    );
    assert.equal(updateSet.status, 200);

    let savedChallenges = await request(baseUrl, '/api/challenges', { cookie: loginA.cookie });
    const findChallenge = title =>
      savedChallenges.body.challenges.find(item => item.title === title);
    assert.equal(findChallenge('Push-Up Month').currentValue, 6);
    assert.equal(findChallenge('Complete Two Workout Sets').currentValue, 1);
    assert.equal(findChallenge('Complete Two Workout Sets').status, 'active');
    assert.equal(findChallenge('Complete One Workout').currentValue, 0);
    assert.equal(findChallenge('Lift Fifty Kilograms').currentValue, 50);
    assert.equal(findChallenge('Lift Fifty Kilograms').status, 'completed');

    const completedWorkout = await request(
      baseUrl,
      `/api/workouts/${workout.body.workout.id}/complete`,
      { method: 'POST', cookie: loginA.cookie, body: {} },
    );
    assert.equal(completedWorkout.status, 200);
    assert.equal(
      (await UserProgress.findOne({ userId: userA._id }).lean()).totalWorkouts,
      1,
      'workout completion updates persistent progress alongside challenge progress',
    );
    savedChallenges = await request(baseUrl, '/api/challenges', { cookie: loginA.cookie });
    assert.equal(
      savedChallenges.body.challenges.find(item => item.title === 'Complete One Workout').status,
      'completed',
    );
    assert.equal(
      savedChallenges.body.challenges.find(item => item.title === 'Push-Up Month').currentValue,
      6,
    );
    const completedEdit = await request(
      baseUrl,
      `/api/challenges/${volumeChallenge.body.challenge.id}`,
      {
        method: 'PATCH',
        cookie: loginA.cookie,
        body: { title: 'Attempt to Edit Completed Challenge' },
      },
    );
    assert.equal(completedEdit.status, 409);

    result = await request(baseUrl, '/api/challenges', { cookie: loginA.cookie });
    assert.ok(result.body.challenges.some(challenge => challenge.id === createdChallengeId));
    const userBChallenges = await request(baseUrl, '/api/challenges', { cookie: loginB.cookie });
    assert.deepEqual(userBChallenges.body.challenges, []);

    const crossUserUpdate = await request(baseUrl, `/api/challenges/${createdChallengeId}`, {
      method: 'PATCH',
      cookie: loginB.cookie,
      body: { title: 'Unauthorized Update' },
    });
    const crossUserDelete = await request(baseUrl, `/api/challenges/${createdChallengeId}`, {
      method: 'DELETE',
      cookie: loginB.cookie,
    });
    assert.equal(crossUserUpdate.status, 404);
    assert.equal(crossUserDelete.status, 404);
    assert.equal(
      (
        await request(baseUrl, `/api/challenges/${createdChallengeId}`, {
          method: 'PATCH',
          body: { title: 'Unauthenticated Update' },
        })
      ).status,
      401,
    );

    const deletedOwn = await request(
      baseUrl,
      `/api/challenges/${setsChallenge.body.challenge.id}`,
      {
        method: 'DELETE',
        cookie: loginA.cookie,
      },
    );
    assert.equal(deletedOwn.status, 204);
    assert.equal(
      await Challenge.findOne({ _id: setsChallenge.body.challenge.id, userId: userA._id }),
      null,
    );

    await request(baseUrl, '/api/auth/logout', { method: 'POST', cookie: loginA.cookie });
    const reloginA = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userA.email, password },
    });
    const afterRefresh = await request(baseUrl, '/api/challenges', { cookie: reloginA.cookie });
    assert.ok(afterRefresh.body.challenges.some(challenge => challenge.id === createdChallengeId));
    assert.equal(
      (await Challenge.findById(createdChallengeId).lean()).currentValue,
      6,
      'challenge progress is persisted in MongoDB',
    );

    const invalidGoal = await request(baseUrl, '/api/challenges', {
      method: 'POST',
      cookie: reloginA.cookie,
      body: { title: 'Untrackable Target', goal: 'Reach a new personal best' },
    });
    assert.equal(invalidGoal.status, 400);

    result = await request(baseUrl, '/api/challenges', {
      method: 'POST',
      cookie: reloginA.cookie,
      body: { title: 'Injected Challenge', goal: '100 reps', userId: String(userB._id) },
    });
    assert.equal(result.status, 400);
  } finally {
    try {
      if (userA || userB) {
        const userIds = [userA?._id, userB?._id].filter(Boolean);
        await Promise.all([
          Challenge.deleteMany({ userId: { $in: userIds } }),
          WorkoutSession.deleteMany({ userId: { $in: userIds } }),
          WorkoutSet.deleteMany({ userId: { $in: userIds } }),
          UserProgress.deleteMany({ userId: { $in: userIds } }),
          RefreshSession.deleteMany({ userId: { $in: userIds } }),
          User.deleteMany({ _id: { $in: userIds } }),
        ]);
        assert.equal(await Challenge.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await WorkoutSession.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await WorkoutSet.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await UserProgress.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await RefreshSession.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await User.countDocuments({ _id: { $in: userIds } }), 0);
      }
    } finally {
      if (server) await new Promise(resolve => server.close(resolve));
      await mongoose.disconnect();
    }
  }
});
