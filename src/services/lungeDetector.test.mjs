import assert from 'node:assert/strict';
import test from 'node:test';
import { LungeDetector } from './lungeDetector.ts';

function createPose(timestampMs, leftAngle = 170, rightAngle = 170, options = {}) {
  const {
    visibility = 0.95,
    presence = visibility,
    leftKneeOffset = 0,
    rightKneeOffset = 0,
    bodyOffset = 0,
  } = options;
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
    {
      shoulder: 11,
      hip: 23,
      knee: 25,
      ankle: 27,
      x: 0.3,
      angle: leftAngle,
      kneeOffset: leftKneeOffset,
    },
    {
      shoulder: 12,
      hip: 24,
      knee: 26,
      ankle: 28,
      x: 0.7,
      angle: rightAngle,
      kneeOffset: rightKneeOffset,
    },
  ]) {
    const radians = degrees => (degrees * Math.PI) / 180;
    const hip = { x: side.x, y: 0, z: 0 };
    const knee = { x: side.x, y: 1, z: 0 };
    const ankle = {
      x: side.x + Math.sin(radians(180 - side.angle)),
      y: 1 + Math.cos(radians(180 - side.angle)),
      z: 0,
    };
    const shoulder = { x: side.x, y: -1, z: 0 };
    for (const [index, point] of [
      [side.shoulder, shoulder],
      [side.hip, hip],
      [side.knee, knee],
      [side.ankle, ankle],
    ]) {
      const normalizedPoint = { ...point };
      if (index === side.hip) normalizedPoint.x += bodyOffset;
      if (index === side.knee) normalizedPoint.x = side.x + side.kneeOffset;
      if (index === side.ankle) normalizedPoint.x = side.x;
      Object.assign(landmarks[index], normalizedPoint, { visibility, presence });
      worldLandmarks[index] = { ...point, index, visibility, presence };
    }
  }
  return { exerciseId: 'ex_lunges', timestampMs, landmarks, worldLandmarks };
}

function feed(detector, leftAngle, rightAngle, count = 5, startAt = 0, options) {
  let result;
  for (let index = 0; index < count; index += 1) {
    result = detector.process(createPose(startAt + index * 80, leftAngle, rightAngle, options));
  }
  return { result, nextTimestamp: startAt + count * 80 };
}

function completeLunge(detector, side = 'left', startAt = 0) {
  const bend = side === 'left' ? [130, 150] : [150, 130];
  const bottom = side === 'left' ? [90, 120] : [120, 90];
  const rising = side === 'left' ? [130, 145] : [145, 130];
  let time = startAt;
  for (const [left, right] of [[170, 170], bend, bottom, rising, [170, 170]]) {
    time = feed(detector, left, right, 5, time).nextTimestamp;
  }
  return time;
}

test('complete left lunge counts one rep and identifies its side', () => {
  const detector = new LungeDetector();
  const time = completeLunge(detector, 'left');
  const result = detector.process(createPose(time, 170, 170));
  assert.equal(result.reps, 1);
  assert.equal(result.side, null);
  assert.equal(result.phase, 'standing');
});

test('complete right lunge counts one rep', () => {
  const detector = new LungeDetector();
  const time = completeLunge(detector, 'right');
  assert.equal(detector.process(createPose(time, 170, 170)).reps, 1);
});

test('alternating sides count two complete lunges', () => {
  const detector = new LungeDetector();
  let time = completeLunge(detector, 'left');
  time = completeLunge(detector, 'right', time);
  assert.equal(detector.process(createPose(time, 170, 170)).reps, 2);
});

test('two complete lunges on one side count two reps', () => {
  const detector = new LungeDetector();
  let time = completeLunge(detector, 'left');
  time = completeLunge(detector, 'left', time);
  assert.equal(detector.process(createPose(time, 170, 170)).reps, 2);
});

test('partial lunge does not count', () => {
  const detector = new LungeDetector();
  let time = feed(detector, 170, 170).nextTimestamp;
  time = feed(detector, 125, 155, 5, time).nextTimestamp;
  feed(detector, 170, 170, 5, time);
  assert.equal(detector.process(createPose(time + 500)).reps, 0);
});

test('incomplete return to standing does not count', () => {
  const detector = new LungeDetector();
  let time = feed(detector, 170, 170).nextTimestamp;
  time = feed(detector, 130, 150, 5, time).nextTimestamp;
  time = feed(detector, 90, 120, 5, time).nextTimestamp;
  time = feed(detector, 125, 145, 5, time).nextTimestamp;
  assert.equal(detector.process(createPose(time, 125, 145)).reps, 0);
});

test('landmark loss interrupts a cycle without creating a rep', () => {
  const detector = new LungeDetector();
  let time = feed(detector, 170, 170).nextTimestamp;
  time = feed(detector, 130, 150, 5, time).nextTimestamp;
  time = feed(detector, 90, 120, 5, time).nextTimestamp;
  const lost = detector.process(createPose(time, 170, 170, { visibility: 0.1 }));
  assert.equal(lost.tracking, false);
  assert.equal(lost.reps, 0);
  assert.equal(detector.process(createPose(time + 600, 170, 170)).reps, 0);
});

test('noisy landmarks around standing do not create duplicate reps', () => {
  const detector = new LungeDetector();
  let time = completeLunge(detector, 'left');
  for (const [left, right] of [
    [145, 170],
    [169, 170],
    [141, 170],
    [168, 170],
    [150, 170],
    [170, 170],
  ]) {
    time = feed(detector, left, right, 1, time).nextTimestamp;
  }
  assert.equal(detector.process(createPose(time + 100, 170, 170)).reps, 1);
});

test('unreliable landmarks pause tracking and provide positioning feedback', () => {
  const detector = new LungeDetector();
  const result = detector.process(createPose(0, 170, 170, { presence: 0.2 }));
  assert.equal(result.tracking, false);
  assert.equal(result.formScore, null);
  assert.match(result.feedback, /camera view/i);
});

test('feedback responds to depth, knee alignment, and back posture', () => {
  const detector = new LungeDetector();
  feed(detector, 170, 170);
  const lowering = feed(detector, 130, 150).result;
  assert.match(lowering.feedback, /go lower/i);
  assert.ok(lowering.formScore >= 0 && lowering.formScore <= 100);

  detector.reset();
  feed(detector, 170, 170);
  const misaligned = feed(detector, 130, 150, 5, 400, { leftKneeOffset: 0.2 }).result;
  assert.match(misaligned.feedback, /front knee aligned/i);

  detector.reset();
  feed(detector, 170, 170);
  const bentBack = feed(detector, 130, 150, 5, 400, { bodyOffset: 0.2 }).result;
  assert.match(bentBack.feedback, /back straight/i);
});
