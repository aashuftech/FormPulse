import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { app } from '../dist/app.js';
import { RefreshSession } from '../dist/models/RefreshSession.js';
import { User } from '../dist/models/User.js';
import { Workout } from '../dist/models/Workout.js';
import { WorkoutSession } from '../dist/models/WorkoutSession.js';
import { WorkoutSet } from '../dist/models/WorkoutSet.js';
import { UserProgress } from '../dist/models/UserProgress.js';

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

test('workout APIs enforce ownership, tracking types, completion, and pagination', async () => {
  assert.ok(
    process.env.MONGODB_URI,
    'MONGODB_URI must be configured for the workout integration test',
  );
  await mongoose.connect(process.env.MONGODB_URI);

  const suffix = randomUUID();
  const password = `WorkoutAa1!${suffix}`;
  const passwordHash = await bcrypt.hash(password, 4);
  let userA;
  let userB;
  let server;
  let assertionCount = 0;

  try {
    userA = await User.create({
      name: 'Workout Test A',
      email: `workout-a-${suffix}@example.invalid`,
      passwordHash,
      emailVerified: true,
      weightKg: 80,
    });
    userB = await User.create({
      name: 'Workout Test B',
      email: `workout-b-${suffix}@example.invalid`,
      passwordHash,
      emailVerified: true,
      weightKg: 60,
    });
    server = await start(app);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    let result = await request(baseUrl, '/api/workouts');
    assert.equal(result.status, 401, 'workout APIs require authentication');

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
    const cookieA = loginA.cookie;
    const cookieB = loginB.cookie;
    assertionCount += 3;

    const repsWorkout = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: cookieA,
      body: {
        title: 'Rep tracking',
        exercises: [{ exerciseId: 'ex_squats', setCount: 2 }],
      },
    });
    assert.equal(repsWorkout.status, 201);
    const repsSession = repsWorkout.body.workout;
    const repsSet = repsSession.sets[0];
    const secondRepsSet = repsSession.sets[1];
    assert.equal(repsSet.trackingType, 'reps');
    assert.equal(repsSet.targetReps, 12);
    result = await request(baseUrl, `/api/workouts/${repsSession.id}`, { cookie: cookieA });
    assert.equal(result.status, 200);
    assert.equal(result.body.workout.id, repsSession.id);
    result = await request(baseUrl, `/api/workouts/${repsSession.id}`, { cookie: cookieB });
    assert.equal(result.status, 404, 'another user cannot retrieve the workout');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/not-an-object-id`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 12 },
    });
    assert.equal(result.status, 400, 'invalid set IDs are rejected');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${repsSet.id}`, {
      method: 'PATCH',
      cookie: cookieB,
      body: { reps: 12, completed: true },
    });
    assert.equal(result.status, 404, 'another user cannot update the workout set');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}`, {
      method: 'DELETE',
      cookie: cookieB,
    });
    assert.equal(result.status, 404, 'another user cannot cancel the workout');
    assertionCount += 9;

    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${secondRepsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 8, completed: true },
    });
    assert.equal(result.status, 409, 'sets must be completed in order');
    result = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: cookieA,
      body: {
        title: 'Over target sets',
        exercises: [{ exerciseId: 'ex_squats', setCount: 4 }],
      },
    });
    assert.equal(result.status, 400, 'set count cannot exceed the exercise target');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${repsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 13, completed: true },
    });
    assert.equal(result.status, 400, 'reps cannot exceed the exercise target');

    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${repsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: {
        reps: 12,
        weightKg: 35,
        formScore: 91,
        estimatedCalories: 4,
        activeDurationSeconds: 60,
        completed: true,
      },
    });
    assert.equal(result.status, 400, 'clients cannot submit their own calorie estimates');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${repsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 12, weightKg: 35, formScore: 91, activeDurationSeconds: 60, completed: true },
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.set.estimatedCalories, 4);
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${repsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 12, completed: true },
    });
    assert.equal(result.status, 409, 'a completed set cannot be submitted twice');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${secondRepsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 10, weightKg: 20, activeDurationSeconds: 30, completed: true },
    });
    assert.equal(result.status, 200);
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${repsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 12, ownerId: String(userB._id) },
    });
    assert.equal(result.status, 400, 'ownerId injection is rejected on set updates');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/complete`, {
      method: 'POST',
      cookie: cookieA,
      body: {},
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.workout.status, 'completed');
    assert.ok(result.body.workout.completedAt);
    assert.ok(result.body.workout.durationSeconds >= 0);
    assert.equal(result.body.workout.estimatedCalories, 6);
    assert.equal(result.body.workout.totalVolumeKg, 620);
    assert.equal(result.body.workout.calorieValuesAreEstimates, true);
    assert.equal(result.body.workout.summary.totalSets, 2);
    assert.equal(result.body.workout.summary.totalReps, 22);
    assert.equal(result.body.workout.summary.exercisesCompleted, 1);
    assert.equal(result.body.workout.summary.totalVolumeKg, 620);
    let savedProgress = await UserProgress.findOne({ userId: userA._id }).lean();
    assert.ok(savedProgress, 'workout completion persists a per-user progress record');
    assert.equal(savedProgress.totalWorkouts, 1);
    assert.equal(savedProgress.totalSets, 2);
    assert.equal(savedProgress.totalReps, 22);
    assert.equal(savedProgress.totalVolumeKg, 620);
    assert.ok(savedProgress.lastCompletedAt);
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/complete`, {
      method: 'POST',
      cookie: cookieA,
      body: {},
    });
    assert.equal(result.status, 404, 'a workout cannot be completed twice');
    result = await request(baseUrl, `/api/workouts/${repsSession.id}/sets/${secondRepsSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 10 },
    });
    assert.equal(result.status, 404, 'completed workouts reject set updates');
    assertionCount += 16;

    const durationWorkout = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: cookieA,
      body: {
        title: 'Duration tracking',
        exercises: [{ exerciseId: 'ex_plank', setCount: 1 }],
      },
    });
    assert.equal(durationWorkout.status, 201);
    const durationSession = durationWorkout.body.workout;
    const durationSet = durationSession.sets[0];
    assert.equal(durationSet.trackingType, 'duration');
    assert.equal(durationSet.targetDurationSeconds, 45);
    result = await request(baseUrl, `/api/workouts/${durationSession.id}/sets/${durationSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { durationSeconds: 46, completed: true },
    });
    assert.equal(result.status, 400, 'duration cannot exceed the exercise target');
    result = await request(baseUrl, `/api/workouts/${durationSession.id}/sets/${durationSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { reps: 3 },
    });
    assert.equal(result.status, 400, 'set values must match the exercise tracking type');
    result = await request(baseUrl, `/api/workouts/${durationSession.id}/sets/${durationSet.id}`, {
      method: 'PATCH',
      cookie: cookieA,
      body: { durationSeconds: 45, formScore: 95, completed: true },
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.set.estimatedCalories, 3);
    result = await request(baseUrl, `/api/workouts/${durationSession.id}/complete`, {
      method: 'POST',
      cookie: cookieA,
      body: {},
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.workout.status, 'completed');
    assert.equal(result.body.workout.estimatedCalories, 3);
    result = await request(baseUrl, '/api/workouts/progress', { cookie: cookieA });
    assert.equal(result.status, 200);
    assert.equal(result.body.progress.totalWorkouts, 2);
    assert.equal(result.body.progress.totalReps, 22);
    assert.equal(result.body.progress.totalEstimatedCalories, 9);
    assert.equal(result.body.progress.personalRecords.highestRepsPerSet, 12);
    assert.equal(result.body.progress.personalRecords.longestPlankSeconds, 45);
    assert.equal(result.body.progress.totalExercises, 2);
    assert.equal(result.body.progress.totalSets, 3);
    assert.equal(result.body.profile.name, 'Workout Test A');
    assert.equal(result.body.profile.email, userA.email);
    assert.equal(result.body.profile.weightKg, 80);
    savedProgress = await UserProgress.findOne({ userId: userA._id }).lean();
    assert.equal(savedProgress.totalWorkouts, 2);
    assert.equal(savedProgress.totalDurationSeconds, 45);
    assert.equal(savedProgress.exerciseProgress.length, 2);
    result = await request(baseUrl, '/api/workouts/progress', { cookie: cookieB });
    assert.equal(result.status, 200);
    assert.equal(
      result.body.progress.totalWorkouts,
      0,
      'progress is scoped to the authenticated user',
    );
    const userBProgress = await UserProgress.findOne({ userId: userB._id }).lean();
    assert.equal(userBProgress.totalWorkouts, 0);
    assert.equal(savedProgress.userId.toString(), String(userA._id));
    assertionCount += 8;

    result = await request(baseUrl, '/api/workouts?limit=101', { cookie: cookieA });
    assert.equal(result.status, 400, 'history page size is capped at 100');
    result = await request(baseUrl, '/api/workouts?page=0', { cookie: cookieA });
    assert.equal(result.status, 400, 'history page number must be positive');
    result = await request(baseUrl, '/api/workouts?page=1&limit=1', { cookie: cookieA });
    assert.equal(result.status, 200);
    assert.equal(result.body.limit, 1);
    assert.equal(result.body.workouts.length, 1);
    assert.equal(result.body.total, 2);
    assert.equal(result.body.hasMore, true);
    result = await request(baseUrl, '/api/workouts', { cookie: cookieB });
    assert.equal(result.body.workouts.length, 0, 'history is scoped to the authenticated user');
    assertionCount += 8;

    const unfinished = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: cookieA,
      body: {
        title: 'Cancel ownership check',
        exercises: [{ exerciseId: 'ex_pushups', setCount: 1 }],
      },
    });
    const unfinishedSession = unfinished.body.workout;
    const unfinishedSet = unfinishedSession.sets[0];
    result = await request(
      baseUrl,
      `/api/workouts/${unfinishedSession.id}/sets/${unfinishedSet.id}`,
      {
        method: 'PATCH',
        cookie: cookieB,
        body: { reps: 1 },
      },
    );
    assert.equal(result.status, 404);
    result = await request(baseUrl, `/api/workouts/${unfinishedSession.id}`, {
      method: 'DELETE',
      cookie: cookieA,
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.workout.status, 'cancelled');
    result = await request(baseUrl, '/api/workouts/not-an-object-id', { cookie: cookieA });
    assert.equal(result.status, 400, 'invalid workout IDs are rejected');
    result = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: cookieA,
      body: {
        title: 'Owner injection',
        userId: String(userB._id),
        exercises: [{ exerciseId: 'ex_squats', setCount: 1 }],
      },
    });
    assert.equal(result.status, 400, 'userId injection is rejected by strict validation');
    result = await request(baseUrl, '/api/workouts', {
      method: 'POST',
      cookie: cookieA,
      body: {
        title: 'Owner injection',
        ownerId: String(userB._id),
        exercises: [{ exerciseId: 'ex_squats', setCount: 1 }],
      },
    });
    assert.equal(result.status, 400, 'ownerId injection is rejected by strict validation');
    assertionCount += 6;

    await request(baseUrl, '/api/auth/logout', { method: 'POST', cookie: cookieA });
    const reloginA = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: userA.email, password },
    });
    const afterLogin = await request(baseUrl, '/api/workouts/progress', {
      cookie: reloginA.cookie,
    });
    assert.equal(afterLogin.status, 200);
    assert.equal(afterLogin.body.progress.totalWorkouts, 2);
    assert.equal(
      await UserProgress.countDocuments({ userId: userA._id }),
      1,
      'reconciliation and relogin do not create duplicate progress records',
    );
    assertionCount += 4;
  } finally {
    try {
      const userIds = [userA?._id, userB?._id].filter(Boolean);
      if (userIds.length > 0) {
        await Promise.all([
          WorkoutSet.deleteMany({ userId: { $in: userIds } }),
          UserProgress.deleteMany({ userId: { $in: userIds } }),
          WorkoutSession.deleteMany({ userId: { $in: userIds } }),
          Workout.deleteMany({ userId: { $in: userIds } }),
          RefreshSession.deleteMany({ userId: { $in: userIds } }),
          User.deleteMany({ _id: { $in: userIds } }),
        ]);
        assert.equal(await User.countDocuments({ _id: { $in: userIds } }), 0);
        assert.equal(await WorkoutSession.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await WorkoutSet.countDocuments({ userId: { $in: userIds } }), 0);
        assert.equal(await UserProgress.countDocuments({ userId: { $in: userIds } }), 0);
      }
    } finally {
      if (server) await new Promise(resolve => server.close(resolve));
      await mongoose.disconnect();
    }
  }

  console.log(
    `Workout integration test passed (${assertionCount} checks); temporary data was removed.`,
  );
});
