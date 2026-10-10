import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { AuthActionToken } from '../dist/models/AuthActionToken.js';
import { Exercise } from '../dist/models/Exercise.js';
import { RefreshSession } from '../dist/models/RefreshSession.js';
import { User } from '../dist/models/User.js';
import { Workout } from '../dist/models/Workout.js';
import { WorkoutSession } from '../dist/models/WorkoutSession.js';
import { WorkoutSet } from '../dist/models/WorkoutSet.js';
import { UserProgress } from '../dist/models/UserProgress.js';

function planIndexNames(plan, names = new Set()) {
  if (!plan || typeof plan !== 'object') return names;
  if (typeof plan.indexName === 'string') names.add(plan.indexName);
  for (const value of Object.values(plan)) {
    if (Array.isArray(value)) value.forEach(item => planIndexNames(item, names));
    else if (value && typeof value === 'object') planIndexNames(value, names);
  }
  return names;
}

function hasIndex(indexes, expectedKeys) {
  return indexes.some(index => {
    const entries = Object.entries(index.key ?? {});
    return (
      entries.length === expectedKeys.length &&
      expectedKeys.every(
        ([field, direction], position) =>
          entries[position]?.[0] === field && entries[position]?.[1] === direction,
      )
    );
  });
}

test('database indexes, TTLs, and query plans match current access patterns', async () => {
  assert.ok(
    process.env.MONGODB_URI,
    'MONGODB_URI must be configured for the index integration test',
  );
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    await Promise.all([
      Exercise.createIndexes(),
      Workout.createIndexes(),
      WorkoutSession.createIndexes(),
      WorkoutSet.createIndexes(),
      UserProgress.createIndexes(),
    ]);
    const [
      exerciseIndexes,
      userIndexes,
      sessionIndexes,
      actionIndexes,
      workoutIndexes,
      workoutSessionIndexes,
      workoutSetIndexes,
      userProgressIndexes,
    ] = await Promise.all([
      Exercise.collection.indexes(),
      User.collection.indexes(),
      RefreshSession.collection.indexes(),
      AuthActionToken.collection.indexes(),
      Workout.collection.indexes(),
      WorkoutSession.collection.indexes(),
      WorkoutSet.collection.indexes(),
      UserProgress.collection.indexes(),
    ]);

    assert.ok(exerciseIndexes.some(index => index.name === '_id_'));
    assert.ok(workoutIndexes.some(index => index.name === '_id_'));
    assert.ok(userIndexes.some(index => index.key.email === 1 && index.unique));
    assert.ok(sessionIndexes.some(index => index.key.tokenHash === 1 && index.unique));
    assert.ok(sessionIndexes.some(index => index.key.rotatedTokenHashes === 1));
    assert.ok(
      hasIndex(sessionIndexes, [
        ['userId', 1],
        ['revokedAt', 1],
        ['lastUsedAt', -1],
        ['expiresAt', 1],
      ]),
    );
    assert.ok(
      sessionIndexes.some(index => index.key.expiresAt === 1 && index.expireAfterSeconds === 0),
    );
    assert.ok(actionIndexes.some(index => index.key.tokenHash === 1 && index.unique));
    assert.ok(
      actionIndexes.some(index => index.key.expiresAt === 1 && index.expireAfterSeconds === 0),
    );
    assert.ok(
      hasIndex(workoutSessionIndexes, [
        ['userId', 1],
        ['status', 1],
        ['startedAt', -1],
        ['_id', -1],
      ]),
    );
    assert.ok(
      hasIndex(workoutSetIndexes, [
        ['userId', 1],
        ['workoutSessionId', 1],
        ['exerciseOrder', 1],
        ['setNumber', 1],
      ]),
    );
    assert.ok(
      workoutSetIndexes.some(
        index => index.unique && index.key.userId === 1 && index.key.workoutSessionId === 1,
      ),
    );
    assert.ok(
      userProgressIndexes.some(index => index.unique && index.key.userId === 1),
      'progress has exactly one unique record per user',
    );

    const now = new Date();
    const userPlan = await User.find({ email: 'index-plan-check@example.invalid' }).explain(
      'queryPlanner',
    );
    const sessionPlan = await RefreshSession.find({
      userId: new mongoose.Types.ObjectId(),
      revokedAt: null,
      expiresAt: { $gt: now },
    })
      .sort({ lastUsedAt: -1 })
      .limit(21)
      .explain('queryPlanner');
    const actionPlan = await AuthActionToken.find({
      tokenHash: '0'.repeat(64),
      purpose: 'verify-email',
      usedAt: null,
      expiresAt: { $gt: now },
    }).explain('queryPlanner');
    const workoutHistoryPlan = await WorkoutSession.find({
      userId: new mongoose.Types.ObjectId(),
      status: 'completed',
    })
      .sort({ startedAt: -1, _id: -1 })
      .limit(21)
      .explain('queryPlanner');
    const workoutSetPlan = await WorkoutSet.find({
      userId: new mongoose.Types.ObjectId(),
      workoutSessionId: new mongoose.Types.ObjectId(),
    })
      .sort({ exerciseOrder: 1, setNumber: 1 })
      .explain('queryPlanner');
    const userProgressPlan = await UserProgress.find({
      userId: new mongoose.Types.ObjectId(),
    }).explain('queryPlanner');

    assert.ok([...planIndexNames(userPlan.queryPlanner.winningPlan)].includes('email_1'));
    assert.ok(
      [...planIndexNames(sessionPlan.queryPlanner.winningPlan)].some(name =>
        name.includes('userId_1_revokedAt_1_lastUsedAt_-1_expiresAt_1'),
      ),
    );
    assert.ok([...planIndexNames(actionPlan.queryPlanner.winningPlan)].includes('tokenHash_1'));
    assert.ok(
      [...planIndexNames(workoutHistoryPlan.queryPlanner.winningPlan)].some(name =>
        name.includes('userId_1_status_1_startedAt_-1__id_-1'),
      ),
    );
    assert.ok(
      [...planIndexNames(workoutSetPlan.queryPlanner.winningPlan)].some(name =>
        name.includes('userId_1_workoutSessionId_1_exerciseOrder_1_setNumber_1'),
      ),
    );
    assert.ok([...planIndexNames(userProgressPlan.queryPlanner.winningPlan)].includes('userId_1'));
  } finally {
    await mongoose.disconnect();
  }
});
