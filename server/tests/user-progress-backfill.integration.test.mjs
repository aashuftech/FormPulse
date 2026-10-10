import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../dist/models/User.js';
import { UserProgress } from '../dist/models/UserProgress.js';
import { WorkoutSession } from '../dist/models/WorkoutSession.js';
import { WorkoutSet } from '../dist/models/WorkoutSet.js';
import { backfillUserProgress } from '../dist/services/workoutService.js';

test('historical workout backfill is scoped, idempotent, and leaves workout records untouched', async () => {
  assert.ok(process.env.MONGODB_URI, 'MONGODB_URI is required for progress backfill tests');
  await mongoose.connect(process.env.MONGODB_URI);

  const suffix = randomUUID();
  const passwordHash = await bcrypt.hash(`BackfillTestAa1!${suffix}`, 4);
  let users = [];
  try {
    users = await User.create([
      {
        name: 'Progress Backfill A',
        email: `progress-backfill-a-${suffix}@example.invalid`,
        passwordHash,
        emailVerified: true,
        weightKg: 75,
      },
      {
        name: 'Progress Backfill B',
        email: `progress-backfill-b-${suffix}@example.invalid`,
        passwordHash,
        emailVerified: true,
        weightKg: 62,
      },
    ]);
    const [userA, userB] = users;
    const completedAt1 = new Date('2026-08-03T10:00:00.000Z');
    const completedAt2 = new Date('2026-08-10T10:00:00.000Z');
    const [sessionA1, sessionA2, sessionB, activeSessionA] = await WorkoutSession.create([
      {
        userId: userA._id,
        title: 'Historical workout one',
        status: 'completed',
        startedAt: new Date(completedAt1.getTime() - 600_000),
        completedAt: completedAt1,
        durationSeconds: 600,
        estimatedCalories: 8,
        averageFormScore: 80,
        totalVolumeKg: 100,
      },
      {
        userId: userA._id,
        title: 'Historical workout two',
        status: 'completed',
        startedAt: new Date(completedAt2.getTime() - 300_000),
        completedAt: completedAt2,
        durationSeconds: 300,
        estimatedCalories: 6,
        averageFormScore: 90,
        totalVolumeKg: 150,
      },
      {
        userId: userB._id,
        title: 'Other user historical workout',
        status: 'completed',
        startedAt: new Date(completedAt2.getTime() - 120_000),
        completedAt: completedAt2,
        durationSeconds: 120,
        estimatedCalories: 5,
        totalVolumeKg: 0,
      },
      {
        userId: userA._id,
        title: 'Still in progress',
        status: 'in-progress',
        startedAt: completedAt2,
      },
    ]);
    await WorkoutSet.create([
      {
        userId: userA._id,
        workoutSessionId: sessionA1._id,
        exerciseId: 'ex_squats',
        exerciseName: 'Squats',
        trackingType: 'reps',
        exerciseOrder: 0,
        setNumber: 1,
        reps: 8,
        weightKg: 10,
        formScore: 80,
        estimatedCalories: 4,
        completed: true,
        completedAt: completedAt1,
      },
      {
        userId: userA._id,
        workoutSessionId: sessionA2._id,
        exerciseId: 'ex_squats',
        exerciseName: 'Squats',
        trackingType: 'reps',
        exerciseOrder: 0,
        setNumber: 1,
        reps: 12,
        weightKg: 15,
        formScore: 90,
        estimatedCalories: 6,
        completed: true,
        completedAt: completedAt2,
      },
      {
        userId: userB._id,
        workoutSessionId: sessionB._id,
        exerciseId: 'ex_plank',
        exerciseName: 'Plank',
        trackingType: 'duration',
        exerciseOrder: 0,
        setNumber: 1,
        durationSeconds: 60,
        formScore: 88,
        estimatedCalories: 5,
        completed: true,
        completedAt: completedAt2,
      },
      {
        userId: userA._id,
        workoutSessionId: activeSessionA._id,
        exerciseId: 'ex_squats',
        exerciseName: 'Squats',
        trackingType: 'reps',
        exerciseOrder: 0,
        setNumber: 1,
        reps: 99,
        completed: true,
        completedAt: completedAt2,
      },
    ]);
    await UserProgress.create({
      userId: userA._id,
      name: 'Stale Stored Name',
      email: `stale-${suffix}@example.invalid`,
      profile: {
        heightCm: 0,
        weightKg: 0,
        goal: 'Build Muscle',
        athleteLevel: 'Beginner',
        experienceYears: 0,
      },
      totalWorkouts: 999,
      totalReps: 999,
      totalSets: 999,
    });

    const beforeSessions = await WorkoutSession.find({ userId: { $in: [userA._id, userB._id] } })
      .select('_id status completedAt durationSeconds totalVolumeKg')
      .sort({ _id: 1 })
      .lean();
    const beforeSets = await WorkoutSet.find({ userId: { $in: [userA._id, userB._id] } })
      .select('_id workoutSessionId completed completedAt reps durationSeconds')
      .sort({ _id: 1 })
      .lean();

    const firstRun = await backfillUserProgress();
    assert.ok(firstRun.usersScanned >= 2, 'backfill includes both test owners');
    assert.ok(firstRun.recordsCreated >= 1, 'missing per-user progress records are created');
    assert.ok(firstRun.recordsUpdated >= 1, 'existing aggregates are reconciled');
    assert.equal(
      firstRun.recordsCreated + firstRun.recordsUpdated,
      firstRun.usersScanned,
      'every scanned existing account is reconciled once',
    );
    const progressA = await UserProgress.findOne({ userId: userA._id }).lean();
    const progressB = await UserProgress.findOne({ userId: userB._id }).lean();
    assert.equal(progressA.totalWorkouts, 2);
    assert.equal(progressA.name, userA.name);
    assert.equal(progressA.email, userA.email);
    assert.deepEqual(progressA.profile, {
      heightCm: userA.heightCm,
      weightKg: userA.weightKg,
      goal: userA.targetGoal,
      athleteLevel: userA.athleteLevel,
      experienceYears: userA.experienceYears,
    });
    assert.equal(progressA.totalSets, 2);
    assert.equal(progressA.totalReps, 20);
    assert.equal(progressA.totalWorkoutTimeSeconds, 900);
    assert.equal(progressA.totalEstimatedCalories, 14);
    assert.equal(progressA.totalVolumeKg, 250);
    assert.equal(progressA.averageFormScore, 85);
    assert.equal(progressA.lastCompletedAt.toISOString(), completedAt2.toISOString());
    assert.equal(progressA.exerciseProgress.length, 1);
    assert.equal(progressA.exerciseProgress[0].totalReps, 20);
    assert.equal(progressA.personalRecords.highestRepsPerSet, 12);
    assert.equal(progressA.weeklyProgress.length, 2);
    assert.equal(progressB.totalWorkouts, 1);
    assert.equal(progressB.totalDurationSeconds, 60);
    assert.equal(progressB.personalRecords.longestPlankSeconds, 60);
    assert.equal(progressB.totalReps, 0);
    assert.equal(await UserProgress.countDocuments({ userId: { $in: [userA._id, userB._id] } }), 2);

    const secondRun = await backfillUserProgress();
    assert.equal(secondRun.usersScanned, firstRun.usersScanned);
    assert.equal(secondRun.recordsCreated, 0, 'reruns do not create duplicate records');
    assert.equal(secondRun.recordsUpdated, firstRun.usersScanned);
    const reconciledA = await UserProgress.findOne({ userId: userA._id }).lean();
    assert.equal(reconciledA.totalWorkouts, 2);
    assert.equal(reconciledA.totalReps, 20);
    assert.equal(reconciledA.totalSets, 2);
    assert.equal(await UserProgress.countDocuments({ userId: userA._id }), 1);

    const afterSessions = await WorkoutSession.find({ userId: { $in: [userA._id, userB._id] } })
      .select('_id status completedAt durationSeconds totalVolumeKg')
      .sort({ _id: 1 })
      .lean();
    const afterSets = await WorkoutSet.find({ userId: { $in: [userA._id, userB._id] } })
      .select('_id workoutSessionId completed completedAt reps durationSeconds')
      .sort({ _id: 1 })
      .lean();
    assert.deepEqual(afterSessions, beforeSessions, 'backfill does not modify workout sessions');
    assert.deepEqual(afterSets, beforeSets, 'backfill does not modify workout sets');
  } finally {
    if (users.length > 0) {
      const userIds = users.map(user => user._id);
      await Promise.all([
        WorkoutSet.deleteMany({ userId: { $in: userIds } }),
        WorkoutSession.deleteMany({ userId: { $in: userIds } }),
        UserProgress.deleteMany({ userId: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
      assert.equal(await WorkoutSession.countDocuments({ userId: { $in: userIds } }), 0);
      assert.equal(await WorkoutSet.countDocuments({ userId: { $in: userIds } }), 0);
      assert.equal(await UserProgress.countDocuments({ userId: { $in: userIds } }), 0);
      assert.equal(await User.countDocuments({ _id: { $in: userIds } }), 0);
    }
    await mongoose.disconnect();
  }
});
