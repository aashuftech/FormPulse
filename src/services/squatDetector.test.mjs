import assert from 'node:assert/strict';
import test from 'node:test';
import { SquatDetector, SquatRepCompletionGate } from './squatDetector.ts';

function createPose(timestampMs, hipAngle, kneeAngle, visibility = 0.95, presence = visibility) {
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
    { shoulder: 11, hip: 23, knee: 25, ankle: 27, offset: -0.08 },
    { shoulder: 12, hip: 24, knee: 26, ankle: 28, offset: 0.08 },
  ]) {
    const radians = degrees => (degrees * Math.PI) / 180;
    const hip = { x: side.offset, y: 0, z: 0 };
    const thighAngle = 90;
    const knee = {
      x: hip.x + Math.cos(radians(thighAngle)),
      y: hip.y + Math.sin(radians(thighAngle)),
      z: 0,
    };
    const shankAngle = thighAngle + 180 - kneeAngle;
    const ankle = {
      x: knee.x + Math.cos(radians(shankAngle)),
      y: knee.y + Math.sin(radians(shankAngle)),
      z: 0,
    };
    const shoulderAngle = thighAngle - hipAngle;
    const shoulder = {
      x: hip.x + Math.cos(radians(shoulderAngle)),
      y: hip.y + Math.sin(radians(shoulderAngle)),
      z: 0,
    };

    for (const [index, point] of [
      [side.shoulder, shoulder],
      [side.hip, hip],
      [side.knee, knee],
      [side.ankle, ankle],
    ]) {
      const normalized = landmarks[index];
      normalized.x = 0.5 + point.x * 0.12;
      normalized.y = 0.5 + point.y * 0.12;
      normalized.z = point.z;
      normalized.visibility = visibility;
      normalized.presence = presence;
      worldLandmarks[index] = { ...point, index, visibility, presence: visibility };
    }
  }

  // Keep the feet wide enough in the image for the front-view knee check.
  landmarks[27].x = 0.4;
  landmarks[28].x = 0.6;
  landmarks[25].x = 0.4;
  landmarks[26].x = 0.6;

  return { exerciseId: 'ex_squats', timestampMs, landmarks, worldLandmarks };
}

function feed(detector, anglePair, count = 5, startAt = 0) {
  let result;
  for (let index = 0; index < count; index += 1) {
    result = detector.process(createPose(startAt + index * 80, anglePair[0], anglePair[1]));
  }
  return { result, nextTimestamp: startAt + count * 80 };
}

function completeCycle(detector, startAt = 0) {
  let currentTime = startAt;
  for (const angles of [
    [170, 170],
    [130, 140],
    [110, 90],
    [130, 120],
    [170, 170],
  ]) {
    const next = feed(detector, angles, 5, currentTime);
    currentTime = next.nextTimestamp;
  }
  return currentTime;
}

test('a complete standing, lowering, bottom, rising, standing cycle counts one rep', () => {
  const detector = new SquatDetector();
  completeCycle(detector);
  assert.equal(detector.process(createPose(2100, 170, 170)).reps, 1);
});

test('a partial squat that returns to standing does not count', () => {
  const detector = new SquatDetector();
  let time = 0;
  for (const angles of [
    [170, 170],
    [130, 140],
    [170, 170],
  ]) {
    time = feed(detector, angles, 5, time).nextTimestamp;
  }
  assert.equal(detector.process(createPose(time, 170, 170)).reps, 0);
});

test('a noisy bottom sample and tracking loss cannot complete a rep', () => {
  const detector = new SquatDetector();
  let time = feed(detector, [170, 170], 5).nextTimestamp;
  time = feed(detector, [130, 140], 5, time).nextTimestamp;
  detector.process(createPose(time, 110, 90));
  time += 80;
  detector.process(createPose(time, 110, 90, 0.2));
  time += 80;
  for (let index = 0; index < 5; index += 1) {
    detector.process(createPose(time, 170, 170));
    time += 80;
  }
  assert.equal(detector.process(createPose(time, 170, 170)).reps, 0);
});

test('multiple valid cycles count exactly once each', () => {
  const detector = new SquatDetector();
  const time = completeCycle(detector);
  completeCycle(detector, time);
  assert.equal(detector.process(createPose(time * 2 + 100, 170, 170)).reps, 2);
});

test('insufficient visibility pauses tracking and suppresses the form score', () => {
  const detector = new SquatDetector();
  const result = detector.process(createPose(0, 170, 170, 0.3));
  assert.equal(result.tracking, false);
  assert.equal(result.reps, 0);
  assert.equal(result.formScore, null);
  assert.match(result.feedback, /camera view/i);
});

test('a supplied low landmark presence score pauses tracking', () => {
  const detector = new SquatDetector();
  const result = detector.process(createPose(0, 170, 170, 0.95, 0.3));
  assert.equal(result.tracking, false);
  assert.equal(result.formScore, null);
});

test('MediaPipe landmarks without a presence field still use their visibility score', () => {
  const detector = new SquatDetector();
  const pose = createPose(0, 170, 170);
  for (const points of [pose.landmarks, pose.worldLandmarks]) {
    for (const point of points) delete point.presence;
  }
  assert.equal(detector.process(pose).tracking, true);
});

test('set completion gate allows only one submission after the target is reached', () => {
  const gate = new SquatRepCompletionGate();
  assert.equal(gate.shouldSubmit('set-one', 7, 8), false);
  assert.equal(gate.shouldSubmit('set-one', 8, 8), true);
  assert.equal(gate.shouldSubmit('set-one', 9, 8), false);
  assert.equal(gate.shouldSubmit('set-two', 8, 8), true);
});

test('a failed set save can retry while successful submissions remain guarded', () => {
  const gate = new SquatRepCompletionGate();
  assert.equal(gate.shouldSubmit('set-one', 8, 8), true);
  assert.equal(gate.shouldSubmit('set-one', 8, 8), false);
  gate.release('set-one');
  assert.equal(gate.shouldSubmit('set-one', 8, 8), true);
});
