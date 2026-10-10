import assert from 'node:assert/strict';
import test from 'node:test';
import { PushUpDetector } from './pushUpDetector.ts';

function createPose(timestampMs, elbowAngle, options = {}) {
  const { visibility = 0.95, presence = visibility, bodyOffset = 0 } = options;
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
    { shoulder: 11, elbow: 13, wrist: 15, hip: 23, ankle: 27, direction: 1 },
    { shoulder: 12, elbow: 14, wrist: 16, hip: 24, ankle: 28, direction: -1 },
  ]) {
    const shoulder = { x: 0.5 + side.direction * 0.2, y: 0.45, z: 0 };
    const elbow = { x: shoulder.x, y: shoulder.y - 0.15, z: 0 };
    const radians = (elbowAngle * Math.PI) / 180;
    const wrist = {
      x: elbow.x + side.direction * Math.sin(radians) * 0.15,
      y: elbow.y + Math.cos(radians) * 0.15,
      z: 0,
    };
    const hip = { x: shoulder.x + side.direction * 0.2, y: shoulder.y + bodyOffset, z: 0 };
    const ankle = { x: shoulder.x + side.direction * 0.4, y: shoulder.y, z: 0 };
    for (const [index, point] of [
      [side.shoulder, shoulder],
      [side.elbow, elbow],
      [side.wrist, wrist],
      [side.hip, hip],
      [side.ankle, ankle],
    ]) {
      const normalized = landmarks[index];
      Object.assign(normalized, point, { visibility, presence });
      worldLandmarks[index] = { ...point, index, visibility, presence };
    }
  }

  return { exerciseId: 'ex_pushups', timestampMs, landmarks, worldLandmarks };
}

function feed(detector, elbowAngle, count = 5, startAt = 0, options) {
  let result;
  for (let index = 0; index < count; index += 1) {
    result = detector.process(createPose(startAt + index * 80, elbowAngle, options));
  }
  return { result, nextTimestamp: startAt + count * 80 };
}

function completePushUp(detector, startAt = 0) {
  let time = startAt;
  for (const angle of [170, 130, 90, 130, 170]) {
    time = feed(detector, angle, 5, time).nextTimestamp;
  }
  return time;
}

test('a complete Push-Up cycle counts exactly one rep', () => {
  const detector = new PushUpDetector();
  completePushUp(detector);
  assert.equal(detector.process(createPose(2100, 170)).reps, 1);
});

test('two complete Push-Ups count exactly two reps', () => {
  const detector = new PushUpDetector();
  const time = completePushUp(detector);
  completePushUp(detector, time);
  assert.equal(detector.process(createPose(time * 2 + 100, 170)).reps, 2);
});

test('partial movement does not count a rep', () => {
  const detector = new PushUpDetector();
  let time = feed(detector, 170).nextTimestamp;
  time = feed(detector, 130, 5, time).nextTimestamp;
  feed(detector, 170, 5, time);
  assert.equal(detector.process(createPose(time + 500, 170)).reps, 0);
});

test('descending without returning to the top does not count a rep', () => {
  const detector = new PushUpDetector();
  let time = feed(detector, 170).nextTimestamp;
  time = feed(detector, 130, 5, time).nextTimestamp;
  feed(detector, 90, 5, time);
  assert.equal(detector.process(createPose(time + 500, 90)).reps, 0);
});

test('landmark loss does not complete a rep', () => {
  const detector = new PushUpDetector();
  let time = feed(detector, 170).nextTimestamp;
  time = feed(detector, 130, 5, time).nextTimestamp;
  time = feed(detector, 90, 5, time).nextTimestamp;
  const missing = detector.process(createPose(time, 170, { visibility: 0.1 }));
  assert.equal(missing.tracking, false);
  assert.equal(missing.reps, 0);
  feed(detector, 170, 5, time + 80);
  assert.equal(detector.process(createPose(time + 600, 170)).reps, 0);
});

test('noisy angle samples do not create duplicate reps', () => {
  const detector = new PushUpDetector();
  let time = feed(detector, 170).nextTimestamp;
  time = feed(detector, 130, 5, time).nextTimestamp;
  time = feed(detector, 90, 5, time).nextTimestamp;
  time = feed(detector, 130, 5, time).nextTimestamp;
  time = feed(detector, 170, 5, time).nextTimestamp;
  for (const angle of [140, 165, 142, 169, 145, 170]) {
    time = feed(detector, angle, 1, time).nextTimestamp;
  }
  assert.equal(detector.process(createPose(time + 100, 170)).reps, 1);
});

test('unreliable pose does not increment reps', () => {
  const detector = new PushUpDetector();
  const result = detector.process(createPose(0, 170, { presence: 0.2 }));
  assert.equal(result.tracking, false);
  assert.equal(result.formScore, null);
  assert.equal(result.reps, 0);
  assert.match(result.feedback, /camera view/i);
});

test('feedback responds to body alignment, depth, extension, and elbow control', () => {
  const detector = new PushUpDetector();
  const aligned = detector.process(createPose(0, 170));
  assert.match(aligned.feedback, /position/i);
  assert.ok(aligned.formScore !== null && aligned.formScore >= 0 && aligned.formScore <= 100);

  detector.reset();
  let time = feed(detector, 170).nextTimestamp;
  const low = feed(detector, 130, 5, time).result;
  assert.match(low.feedback, /lower/i);

  detector.reset();
  time = feed(detector, 170).nextTimestamp;
  time = feed(detector, 130, 5, time).nextTimestamp;
  time = feed(detector, 90, 5, time).nextTimestamp;
  const extending = feed(detector, 130, 5, time).result;
  assert.match(extending.feedback, /fully extend/i);

  detector.reset();
  const crooked = detector.process(createPose(0, 170, { bodyOffset: 0.15 }));
  assert.match(crooked.feedback, /body straight/i);

  detector.reset();
  time = feed(detector, 170).nextTimestamp;
  const bottom = feed(detector, 70, 5, time).result;
  assert.match(bottom.feedback, /elbows controlled/i);
});
