import type { PoseFrame, PoseLandmark, PoseWorldLandmark } from './poseProcessing';

export type LungePhase = 'waiting' | 'standing' | 'descending' | 'bottom' | 'ascending';
export type LungeSide = 'left' | 'right';

export interface LungeDetectionResult {
  phase: LungePhase;
  side: LungeSide | null;
  reps: number;
  feedback: string;
  formScore: number | null;
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
  tracking: boolean;
}

export interface LungeDetectorDiagnostics {
  exerciseId: PoseFrame['exerciseId'];
  phase: LungePhase;
  candidatePhase: LungePhase | null;
  side: LungeSide | null;
  reps: number;
  tracking: boolean;
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
  leftHipAngle: number | null;
  rightHipAngle: number | null;
  reliability: Record<
    | 'leftHip'
    | 'leftKnee'
    | 'leftAnkle'
    | 'rightHip'
    | 'rightKnee'
    | 'rightAnkle'
    | 'leftShoulder'
    | 'rightShoulder',
    number | null
  >;
  feedback: string;
  formScore: number | null;
}

type DiagnosticCallback = (diagnostics: LungeDetectorDiagnostics) => void;
type Point = PoseLandmark | PoseWorldLandmark;

interface SidePose {
  shoulder: PoseLandmark;
  hip: PoseLandmark;
  knee: PoseLandmark;
  ankle: PoseLandmark;
  worldShoulder: PoseWorldLandmark;
  worldHip: PoseWorldLandmark;
  worldKnee: PoseWorldLandmark;
  worldAnkle: PoseWorldLandmark;
}

interface SideSample {
  kneeAngle: number;
  hipAngle: number;
  kneeAlignment: number;
  backAlignment: number;
  side: LungeSide;
}

interface PoseSample {
  left: SideSample;
  right: SideSample;
  front: SideSample;
  rear: SideSample;
  minKneeAngle: number;
}

const SIDE_INDICES: Record<
  LungeSide,
  { shoulder: number; hip: number; knee: number; ankle: number }
> = {
  left: { shoulder: 11, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, hip: 24, knee: 26, ankle: 28 },
};
const MIN_CONFIDENCE = 0.6;
const MIN_PHASE_FRAMES = 3;
const MIN_PHASE_DURATION_MS = 140;
const TRACKING_LOSS_RESET_MS = 600;

function confidence(point: Point) {
  return Math.min(point.visibility ?? point.presence ?? 0, point.presence ?? point.visibility ?? 0);
}

function reliable<T extends Point>(points: T[], index: number): T | null {
  const point = points[index];
  if (!point || confidence(point) < MIN_CONFIDENCE) return null;
  return [point.x, point.y, point.z].every(Number.isFinite) ? point : null;
}

function angleAtJoint(first: Point, joint: Point, last: Point) {
  const a = [first.x - joint.x, first.y - joint.y, first.z - joint.z];
  const b = [last.x - joint.x, last.y - joint.y, last.z - joint.z];
  const lengths = [Math.hypot(...a), Math.hypot(...b)];
  if (lengths.some(length => length === 0)) return null;
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  return (Math.acos(Math.max(-1, Math.min(1, dot / (lengths[0] * lengths[1])))) * 180) / Math.PI;
}

function readSide(frame: PoseFrame, side: LungeSide): SidePose | null {
  const indices = SIDE_INDICES[side];
  const shoulder = reliable(frame.landmarks, indices.shoulder);
  const hip = reliable(frame.landmarks, indices.hip);
  const knee = reliable(frame.landmarks, indices.knee);
  const ankle = reliable(frame.landmarks, indices.ankle);
  const worldShoulder = reliable(frame.worldLandmarks, indices.shoulder);
  const worldHip = reliable(frame.worldLandmarks, indices.hip);
  const worldKnee = reliable(frame.worldLandmarks, indices.knee);
  const worldAnkle = reliable(frame.worldLandmarks, indices.ankle);
  if (
    !shoulder ||
    !hip ||
    !knee ||
    !ankle ||
    !worldShoulder ||
    !worldHip ||
    !worldKnee ||
    !worldAnkle
  )
    return null;
  return { shoulder, hip, knee, ankle, worldShoulder, worldHip, worldKnee, worldAnkle };
}

function lineDistance(first: PoseLandmark, middle: PoseLandmark, last: PoseLandmark) {
  const length = Math.hypot(last.x - first.x, last.y - first.y);
  if (!length) return Number.POSITIVE_INFINITY;
  return (
    Math.abs(
      (last.x - first.x) * (first.y - middle.y) - (first.x - middle.x) * (last.y - first.y),
    ) / length
  );
}

function measure(pose: SidePose, side: LungeSide): SideSample | null {
  const kneeAngle = angleAtJoint(pose.worldHip, pose.worldKnee, pose.worldAnkle);
  const hipAngle = angleAtJoint(pose.worldShoulder, pose.worldHip, pose.worldKnee);
  if (kneeAngle === null || hipAngle === null) return null;
  return {
    kneeAngle,
    hipAngle,
    kneeAlignment: Math.abs(pose.knee.x - pose.ankle.x),
    backAlignment: lineDistance(pose.shoulder, pose.hip, pose.knee),
    side,
  };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function score(sample: PoseSample) {
  const depth = clamp(((150 - sample.front.kneeAngle) / 55) * 100, 0, 100);
  const alignment = clamp(100 - sample.front.kneeAlignment * 350, 0, 100);
  const back = clamp(100 - sample.front.backAlignment * 350, 0, 100);
  return Math.round(depth * 0.35 + alignment * 0.3 + back * 0.35);
}

function feedback(sample: PoseSample, phase: LungePhase) {
  if (sample.front.backAlignment > 0.14) return 'Keep your back straight.';
  if (sample.front.kneeAlignment > 0.16) return 'Keep your front knee aligned.';
  if (phase === 'descending' || phase === 'bottom') return 'Go lower.';
  if (phase === 'ascending') return 'Return to standing.';
  return 'Good position. Begin your lunge when ready.';
}

export class LungeDetector {
  private phase: LungePhase = 'waiting';
  private side: LungeSide | null = null;
  private reps = 0;
  private samples: PoseSample[] = [];
  private candidate: {
    phase: LungePhase;
    side: LungeSide | null;
    frames: number;
    startedAt: number;
  } | null = null;
  private lastTimestamp: number | null = null;
  private lowestKneeAngle = Number.POSITIVE_INFINITY;
  private reachedBottom = false;

  reset() {
    this.phase = 'waiting';
    this.side = null;
    this.reps = 0;
    this.samples = [];
    this.candidate = null;
    this.lastTimestamp = null;
    this.lowestKneeAngle = Number.POSITIVE_INFINITY;
    this.reachedBottom = false;
  }

  process(frame: PoseFrame, onDiagnostics?: DiagnosticCallback): LungeDetectionResult {
    const timestamp = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;
    if (this.lastTimestamp !== null && timestamp - this.lastTimestamp > TRACKING_LOSS_RESET_MS)
      this.interruptCycle();
    this.lastTimestamp = timestamp;
    const leftPose = readSide(frame, 'left');
    const rightPose = readSide(frame, 'right');
    const left = leftPose ? measure(leftPose, 'left') : null;
    const right = rightPose ? measure(rightPose, 'right') : null;
    if (!left || !right) {
      this.candidate = null;
      this.samples = [];
      this.interruptCycle();
      const result: LungeDetectionResult = {
        phase: this.phase,
        side: this.side,
        reps: this.reps,
        feedback: 'Move into camera view and show your full body.',
        formScore: null,
        leftKneeAngle: left?.kneeAngle ?? null,
        rightKneeAngle: right?.kneeAngle ?? null,
        tracking: false,
      };
      this.emitDiagnostics(frame, left, right, result, onDiagnostics);
      return result;
    }

    this.samples.push({
      left,
      right,
      front: left.kneeAngle <= right.kneeAngle ? left : right,
      rear: left.kneeAngle <= right.kneeAngle ? right : left,
      minKneeAngle: Math.min(left.kneeAngle, right.kneeAngle),
    });
    if (this.samples.length > 3) this.samples.shift();
    const latest = this.samples[this.samples.length - 1];
    const leftSample: SideSample = {
      ...latest.left,
      kneeAngle: median(this.samples.map(item => item.left.kneeAngle)),
      hipAngle: median(this.samples.map(item => item.left.hipAngle)),
    };
    const rightSample: SideSample = {
      ...latest.right,
      kneeAngle: median(this.samples.map(item => item.right.kneeAngle)),
      hipAngle: median(this.samples.map(item => item.right.hipAngle)),
    };
    const frontSide = this.side ?? latest.front.side;
    const sample: PoseSample = {
      left: leftSample,
      right: rightSample,
      front: frontSide === 'left' ? leftSample : rightSample,
      rear: frontSide === 'left' ? rightSample : leftSample,
      minKneeAngle: median(this.samples.map(item => item.minKneeAngle)),
    };
    this.advance(sample, timestamp);
    const result: LungeDetectionResult = {
      phase: this.phase,
      side: this.side,
      reps: this.reps,
      feedback: feedback(sample, this.phase),
      formScore: score(sample),
      leftKneeAngle: Math.round(sample.left.kneeAngle),
      rightKneeAngle: Math.round(sample.right.kneeAngle),
      tracking: true,
    };
    this.emitDiagnostics(frame, left, right, result, onDiagnostics);
    return result;
  }

  private emitDiagnostics(
    frame: PoseFrame,
    left: SideSample | null,
    right: SideSample | null,
    result: LungeDetectionResult,
    callback?: DiagnosticCallback,
  ) {
    if (!callback) return;
    const confidenceAt = (index: number) => {
      const point = frame.landmarks[index];
      return point ? confidence(point) : null;
    };
    callback({
      exerciseId: frame.exerciseId,
      phase: result.phase,
      candidatePhase: this.candidate?.phase ?? null,
      side: result.side,
      reps: result.reps,
      tracking: result.tracking,
      leftKneeAngle: result.leftKneeAngle,
      rightKneeAngle: result.rightKneeAngle,
      leftHipAngle: left?.hipAngle ?? null,
      rightHipAngle: right?.hipAngle ?? null,
      reliability: {
        leftHip: confidenceAt(23),
        leftKnee: confidenceAt(25),
        leftAnkle: confidenceAt(27),
        rightHip: confidenceAt(24),
        rightKnee: confidenceAt(26),
        rightAnkle: confidenceAt(28),
        leftShoulder: confidenceAt(11),
        rightShoulder: confidenceAt(12),
      },
      feedback: result.feedback,
      formScore: result.formScore,
    });
  }

  private interruptCycle() {
    this.phase = 'waiting';
    this.side = null;
    this.candidate = null;
    this.lowestKneeAngle = Number.POSITIVE_INFINITY;
    this.reachedBottom = false;
  }

  private advance(sample: PoseSample, timestamp: number) {
    const standing = sample.left.kneeAngle >= 155 && sample.right.kneeAngle >= 155;
    const selectedSide =
      this.phase === 'standing' && this.candidate?.phase !== 'descending'
        ? sample.left.kneeAngle <= sample.right.kneeAngle
          ? 'left'
          : 'right'
        : this.side;
    const frontAngle =
      selectedSide === 'left'
        ? sample.left.kneeAngle
        : selectedSide === 'right'
          ? sample.right.kneeAngle
          : sample.minKneeAngle;
    const rearAngle = selectedSide === 'left' ? sample.right.kneeAngle : sample.left.kneeAngle;
    let desired = this.phase;
    if (this.phase === 'waiting') {
      if (standing) desired = 'standing';
    } else if (this.phase === 'standing') {
      if (sample.minKneeAngle <= 140) {
        this.side = selectedSide;
        desired = 'descending';
      }
    } else if (this.phase === 'descending') {
      if (frontAngle <= 105 && rearAngle <= 140) desired = 'bottom';
      else if (standing) desired = 'standing';
    } else if (this.phase === 'bottom') {
      this.lowestKneeAngle = Math.min(this.lowestKneeAngle, frontAngle);
      if (frontAngle >= this.lowestKneeAngle + 12 || standing) desired = 'ascending';
    } else if (this.phase === 'ascending' && standing) {
      desired = 'standing';
    }
    if (desired === this.phase) {
      this.candidate = null;
      return;
    }
    const nextSide = this.side;
    if (this.candidate?.phase !== desired || this.candidate.side !== nextSide) {
      this.candidate = { phase: desired, side: nextSide, frames: 1, startedAt: timestamp };
      return;
    }
    this.candidate.frames += 1;
    if (
      this.candidate.frames < MIN_PHASE_FRAMES ||
      timestamp - this.candidate.startedAt < MIN_PHASE_DURATION_MS
    )
      return;
    const previous = this.phase;
    this.phase = desired;
    this.candidate = null;
    if (previous === 'descending' && desired === 'bottom') {
      this.reachedBottom = true;
      this.lowestKneeAngle = frontAngle;
    }
    if (previous === 'ascending' && desired === 'standing') {
      if (this.reachedBottom) this.reps += 1;
      this.side = null;
      this.reachedBottom = false;
      this.lowestKneeAngle = Number.POSITIVE_INFINITY;
    }
    if (previous === 'descending' && desired === 'standing') {
      this.side = null;
      this.reachedBottom = false;
    }
  }
}
