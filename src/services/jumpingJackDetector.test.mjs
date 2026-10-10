import assert from 'node:assert/strict';
import test from 'node:test';
import { JumpingJackDetector } from './jumpingJackDetector.ts';

function createPose(
  timestampMs,
  {
    leftArmLift = -0.6,
    rightArmLift = leftArmLift,
    legSpreadRatio = 1,
    visibility = 0.95,
    presence = visibility,
  } = {},
) {
  const landmarks = Array.from({ length: 33 }, (_, index) => ({
    index,
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0,
    presence: 0,
  }));
  const set = (index, x, y, confidence = visibility) => {
    Object.assign(landmarks[index], { x, y, z: 0, visibility: confidence, presence });
  };
  set(11, 0.4, 0.3);
  set(12, 0.6, 0.3);
  set(15, 0.4, 0.3 - leftArmLift * 0.25);
  set(16, 0.6, 0.3 - rightArmLift * 0.25);
  set(23, 0.4, 0.55);
  set(24, 0.6, 0.55);
  set(25, 0.4, 0.7);
  set(26, 0.6, 0.7);
  const ankleDistance = 0.2 * legSpreadRatio;
  set(27, 0.5 - ankleDistance / 2, 0.9);
  set(28, 0.5 + ankleDistance / 2, 0.9);
  return {
    exerciseId: 'ex_jumping_jacks',
    timestampMs,
    landmarks,
    worldLandmarks: landmarks.map(point => ({ ...point })),
  };
}

function feed(detector, options, count = 5, startAt = 0) {
  let result;
  for (let index = 0; index < count; index += 1) {
    result = detector.process(createPose(startAt + index * 80, options));
  }
  return { result, nextTimestamp: startAt + count * 80 };
}

function completeJumpingJack(detector, startAt = 0) {
  let time = startAt;
  time = feed(
    detector,
    { leftArmLift: -0.6, rightArmLift: -0.6, legSpreadRatio: 1 },
    8,
    time,
  ).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: 0.7, rightArmLift: 0.7, legSpreadRatio: 2.5 },
    8,
    time,
  ).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: -0.6, rightArmLift: -0.6, legSpreadRatio: 1 },
    8,
    time,
  ).nextTimestamp;
  return time;
}

test('one complete Jumping Jack counts exactly one rep', () => {
  const detector = new JumpingJackDetector();
  const time = completeJumpingJack(detector);
  assert.equal(detector.process(createPose(time, {})).reps, 1);
});

test('two complete Jumping Jacks count exactly two reps', () => {
  const detector = new JumpingJackDetector();
  let time = completeJumpingJack(detector);
  time = completeJumpingJack(detector, time);
  assert.equal(detector.process(createPose(time, {})).reps, 2);
});

test('partial opening does not count', () => {
  const detector = new JumpingJackDetector();
  let time = feed(detector, {}).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: 0.2, rightArmLift: 0.2, legSpreadRatio: 1.2 },
    5,
    time,
  ).nextTimestamp;
  feed(detector, {}, 5, time);
  assert.equal(detector.process(createPose(time + 500, {})).reps, 0);
});

test('opening without closing does not count', () => {
  const detector = new JumpingJackDetector();
  let time = feed(detector, {}).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: 0.7, rightArmLift: 0.7, legSpreadRatio: 2.5 },
    5,
    time,
  ).nextTimestamp;
  assert.equal(
    detector.process(createPose(time, { leftArmLift: 0.7, rightArmLift: 0.7, legSpreadRatio: 2.5 }))
      .reps,
    0,
  );
});

test('arm-only movement does not count', () => {
  const detector = new JumpingJackDetector();
  let time = feed(detector, {}).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: 0.7, rightArmLift: 0.7, legSpreadRatio: 1 },
    5,
    time,
  ).nextTimestamp;
  feed(detector, {}, 5, time);
  assert.equal(detector.process(createPose(time + 500, {})).reps, 0);
});

test('leg-only movement does not count', () => {
  const detector = new JumpingJackDetector();
  let time = feed(detector, {}).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: -0.6, rightArmLift: -0.6, legSpreadRatio: 2.5 },
    5,
    time,
  ).nextTimestamp;
  feed(detector, {}, 5, time);
  assert.equal(detector.process(createPose(time + 500, {})).reps, 0);
});

test('landmark loss during a cycle cannot create a rep', () => {
  const detector = new JumpingJackDetector();
  let time = feed(detector, {}).nextTimestamp;
  time = feed(
    detector,
    { leftArmLift: 0.7, rightArmLift: 0.7, legSpreadRatio: 2.5 },
    5,
    time,
  ).nextTimestamp;
  const lost = detector.process(createPose(time, { visibility: 0.1 }));
  assert.equal(lost.tracking, false);
  assert.equal(lost.reps, 0);
  assert.equal(detector.process(createPose(time + 600, {})).reps, 0);
});

test('noisy landmarks do not create duplicate reps', () => {
  const detector = new JumpingJackDetector();
  let time = completeJumpingJack(detector);
  for (const [leftArmLift, rightArmLift, legSpreadRatio] of [
    [-0.2, -0.6, 1.2],
    [-0.6, -0.5, 1],
    [-0.1, -0.6, 1.1],
    [-0.6, -0.4, 1],
  ]) {
    time = feed(detector, { leftArmLift, rightArmLift, legSpreadRatio }, 1, time).nextTimestamp;
  }
  assert.equal(detector.process(createPose(time + 100, {})).reps, 1);
});

test('unreliable pose does not increment reps and requests better positioning', () => {
  const detector = new JumpingJackDetector();
  const result = detector.process(createPose(0, { visibility: 0.2 }));
  assert.equal(result.tracking, false);
  assert.equal(result.reps, 0);
  assert.equal(result.formScore, null);
  assert.match(result.feedback, /camera view/i);
});

test('feedback identifies arm coordination, arm height, and leg spread', () => {
  const detector = new JumpingJackDetector();
  let time = feed(detector, {}).nextTimestamp;
  const armCue = feed(
    detector,
    { leftArmLift: 0.7, rightArmLift: 0.1, legSpreadRatio: 2.5 },
    5,
    time,
  ).result;
  assert.match(armCue.feedback, /arms coordinated/i);

  detector.reset();
  time = feed(detector, {}).nextTimestamp;
  const raiseCue = feed(
    detector,
    { leftArmLift: 0.2, rightArmLift: 0.2, legSpreadRatio: 2.5 },
    5,
    time,
  ).result;
  assert.match(raiseCue.feedback, /raise your arms/i);

  detector.reset();
  time = feed(detector, {}).nextTimestamp;
  const legsCue = feed(
    detector,
    { leftArmLift: 0.7, rightArmLift: 0.7, legSpreadRatio: 1.4 },
    5,
    time,
  ).result;
  assert.match(legsCue.feedback, /spread your legs/i);
  assert.ok(legsCue.formScore >= 0 && legsCue.formScore <= 100);
});
