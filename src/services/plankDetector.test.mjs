import assert from 'node:assert/strict';
import test from 'node:test';
import { PlankDetector } from './plankDetector.ts';

function createPose(
  timestampMs,
  { hipOffset = 0, elbowAngle = 90, visibility = 0.95, presence = visibility } = {},
) {
  const landmarks = Array.from({ length: 33 }, (_, index) => ({
    index,
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0,
    presence: 0,
  }));
  const worldLandmarks = landmarks.map(point => ({ ...point }));
  for (const side of [
    { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27, offset: -0.1 },
    { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28, offset: 0.1 },
  ]) {
    const points = [
      [side.shoulder, { x: side.offset, y: 0, z: 0 }],
      [side.elbow, { x: side.offset, y: 0.1, z: 0 }],
      [
        side.wrist,
        {
          x: side.offset + Math.sin((elbowAngle * Math.PI) / 180) * 0.1,
          y: 0.1 - Math.cos((elbowAngle * Math.PI) / 180) * 0.1,
          z: 0,
        },
      ],
      [side.hip, { x: 0.45 + side.offset, y: hipOffset, z: 0 }],
      [side.knee, { x: 0.7 + side.offset, y: hipOffset / 2, z: 0 }],
      [side.ankle, { x: 1 + side.offset, y: 0, z: 0 }],
    ];
    for (const [index, point] of points) {
      Object.assign(landmarks[index], point, { visibility, presence });
      worldLandmarks[index] = { ...point, index, visibility, presence };
    }
  }
  return { exerciseId: 'ex_plank', timestampMs, landmarks, worldLandmarks };
}

function feed(
  detector,
  { count = 1, startAt = 0, hipOffset = 0, elbowAngle = 90, visibility = 0.95, target } = {},
) {
  let result;
  for (let index = 0; index < count; index += 1) {
    result = detector.process(
      createPose(startAt + index * 80, { hipOffset, elbowAngle, visibility }),
      target,
    );
  }
  return { result, nextTimestamp: startAt + count * 80 };
}

function startHold(detector, startAt = 0, target) {
  const { nextTimestamp } = feed(detector, { count: 5, startAt, target });
  return nextTimestamp;
}

test('a valid plank enters holding only after stable valid frames', () => {
  const detector = new PlankDetector();
  let result;
  let time = 0;
  for (let index = 0; index < 5; index += 1) {
    result = detector.process(createPose(time));
    time += 80;
  }
  assert.equal(result.phase, 'holding');
  assert.equal(result.holding, true);
  assert.ok(result.validDurationSeconds >= 0);
});

test('valid hold accumulates time from frame timestamps', () => {
  const detector = new PlankDetector();
  let time = startHold(detector);
  time = feed(detector, { count: 16, startAt: time }).nextTimestamp;
  const result = detector.process(createPose(time));
  assert.equal(result.phase, 'holding');
  assert.equal(result.validDurationSeconds, 1.36);
});

test('invalid posture time is not added to valid hold duration', () => {
  const detector = new PlankDetector();
  let time = startHold(detector);
  time = feed(detector, { count: 8, startAt: time }).nextTimestamp;
  const beforeBreak = detector.process(createPose(time)).validDurationSeconds;
  detector.process(createPose(time + 80, { hipOffset: 0.2 }));
  const invalid = detector.process(createPose(time + 160, { hipOffset: 0.2 }));
  assert.equal(invalid.validDurationSeconds, beforeBreak);
  detector.process(createPose(time + 240));
  const resumed = detector.process(createPose(time + 320));
  assert.equal(resumed.validDurationSeconds, beforeBreak);
});

test('brief landmark noise pauses timing without resetting a hold', () => {
  const detector = new PlankDetector();
  let time = startHold(detector);
  time = feed(detector, { count: 5, startAt: time }).nextTimestamp;
  const beforeNoise = detector.process(createPose(time)).validDurationSeconds;
  const noise = detector.process(createPose(time + 80, { visibility: 0.1 }));
  assert.equal(noise.phase, 'holding');
  assert.equal(noise.holding, false);
  detector.process(createPose(time + 160));
  const resumed = detector.process(createPose(time + 240));
  assert.equal(resumed.phase, 'holding');
  assert.equal(resumed.holding, true);
  assert.equal(resumed.validDurationSeconds, beforeNoise);
});

test('sustained invalid posture pauses the hold and preserves counted time', () => {
  const detector = new PlankDetector();
  let time = startHold(detector);
  time = feed(detector, { count: 5, startAt: time }).nextTimestamp;
  const validDuration = detector.process(createPose(time)).validDurationSeconds;
  let result;
  for (let index = 1; index <= 7; index += 1) {
    result = detector.process(createPose(time + index * 80, { hipOffset: 0.2 }));
  }
  assert.equal(result.phase, 'invalid');
  assert.equal(result.validDurationSeconds, validDuration);
  assert.equal(result.holding, false);
});

test('target duration is reported once accumulated valid time reaches it', () => {
  const detector = new PlankDetector();
  let time = startHold(detector, 0, 1);
  let result;
  for (let index = 0; index < 13; index += 1) {
    result = detector.process(createPose(time, {}), 1);
    time += 80;
  }
  assert.equal(result.targetReached, true);
  assert.ok(result.validDurationSeconds >= 1);
});

test('large timestamp gaps and duplicate frames do not create timing jumps', () => {
  const detector = new PlankDetector();
  const time = startHold(detector);
  const first = detector.process(createPose(time)).validDurationSeconds;
  assert.equal(detector.process(createPose(time)).validDurationSeconds, first);
  const afterGap = detector.process(createPose(time + 5000)).validDurationSeconds;
  assert.equal(afterGap, first);
  assert.equal(detector.process(createPose(time + 5080)).validDurationSeconds, first + 0.08);
});

test('a timestamp gap cannot satisfy stable plank entry', () => {
  const detector = new PlankDetector();
  detector.process(createPose(0));
  assert.equal(detector.process(createPose(80)).phase, 'entering');
  assert.equal(detector.process(createPose(4000)).phase, 'invalid');
  assert.equal(detector.process(createPose(4080)).phase, 'entering');
  assert.equal(detector.process(createPose(4160)).phase, 'entering');
});

test('reset clears accumulated valid duration and begins a fresh entry', () => {
  const detector = new PlankDetector();
  const time = startHold(detector);
  const held = feed(detector, { count: 5, startAt: time }).result;
  assert.ok(held.validDurationSeconds > 0);
  detector.reset();
  const reset = detector.process(createPose(time + 500));
  assert.equal(reset.phase, 'invalid');
  assert.equal(reset.validDurationSeconds, 0);
  assert.equal(reset.holding, false);
  assert.equal(detector.process(createPose(time + 580)).phase, 'entering');
});

test('unreliable landmarks cannot begin or continue a valid hold', () => {
  const detector = new PlankDetector();
  let result;
  for (let index = 0; index < 8; index += 1) {
    result = detector.process(createPose(index * 80, { visibility: 0.2 }));
  }
  assert.equal(result.tracking, false);
  assert.equal(result.holding, false);
  assert.equal(result.validDurationSeconds, 0);
  assert.match(result.feedback, /camera view/i);
});

test('hip offsets and unstable elbows produce clear coaching feedback', () => {
  const detector = new PlankDetector();
  const lower = detector.process(createPose(0, { hipOffset: -0.2 }));
  assert.match(lower.feedback, /lower your hips/i);
  detector.reset();
  const raise = detector.process(createPose(0, { hipOffset: 0.2 }));
  assert.match(raise.feedback, /raise your hips/i);
  detector.reset();
  const aligned = detector.process(createPose(0));
  assert.match(aligned.feedback, /core engaged/i);
  assert.ok(aligned.formScore !== null && aligned.formScore >= 0 && aligned.formScore <= 100);
  detector.reset();
  const unstableElbows = detector.process(createPose(0, { elbowAngle: 155 }));
  assert.match(unstableElbows.feedback, /elbows stable/i);
});
