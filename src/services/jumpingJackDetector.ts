import type { PoseFrame, PoseLandmark } from './poseProcessing';

export type JumpingJackPhase = 'waiting' | 'closed' | 'opening' | 'open' | 'closing';

export interface JumpingJackDetectionResult {
  phase: JumpingJackPhase;
  reps: number;
  feedback: string;
  formScore: number | null;
  leftArmLift: number | null;
  rightArmLift: number | null;
  legSpreadRatio: number | null;
  tracking: boolean;
}

export interface JumpingJackDetectorDiagnostics {
  exerciseId: PoseFrame['exerciseId'];
  phase: JumpingJackPhase;
  candidatePhase: JumpingJackPhase | null;
  reps: number;
  tracking: boolean;
  armsOpen: boolean | null;
  legsOpen: boolean | null;
  closedPosition: boolean | null;
  leftArmLift: number | null;
  rightArmLift: number | null;
  legSpreadRatio: number | null;
  torsoLength: number | null;
  reliability: Record<
    | 'leftShoulder'
    | 'rightShoulder'
    | 'leftWrist'
    | 'rightWrist'
    | 'leftHip'
    | 'rightHip'
    | 'leftKnee'
    | 'rightKnee'
    | 'leftAnkle'
    | 'rightAnkle',
    number | null
  >;
  feedback: string;
  formScore: number | null;
}

type DiagnosticsCallback = (diagnostics: JumpingJackDetectorDiagnostics) => void;

interface Measurements {
  leftArmLift: number;
  rightArmLift: number;
  legSpreadRatio: number;
  torsoLength: number;
  armsOpen: boolean;
  legsOpen: boolean;
  armsClosed: boolean;
  legsClosed: boolean;
}

const LANDMARKS = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;
const MIN_CONFIDENCE = 0.6;
const MIN_PHASE_FRAMES = 3;
const MIN_PHASE_DURATION_MS = 140;
const TRACKING_LOSS_RESET_MS = 600;
const ARM_OPEN_THRESHOLD = 0.4;
const ARM_CLOSED_THRESHOLD = 0.12;
const LEG_OPEN_THRESHOLD = 1.9;
const LEG_CLOSED_THRESHOLD = 1.35;

function confidence(point: PoseLandmark) {
  return Math.min(point.visibility ?? point.presence ?? 0, point.presence ?? point.visibility ?? 0);
}

function validPoint(points: PoseLandmark[], index: number) {
  const point = points[index];
  if (!point || confidence(point) < MIN_CONFIDENCE) return null;
  return [point.x, point.y, point.z].every(Number.isFinite) ? point : null;
}

function median(values: number[]) {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function measure(frame: PoseFrame): Measurements | null {
  const points = Object.fromEntries(
    Object.entries(LANDMARKS).map(([name, index]) => [name, validPoint(frame.landmarks, index)]),
  ) as Record<keyof typeof LANDMARKS, PoseLandmark | null>;
  if (Object.values(points).some(point => point === null)) return null;
  const {
    leftShoulder,
    rightShoulder,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftAnkle,
    rightAnkle,
  } = points as Record<keyof typeof LANDMARKS, PoseLandmark>;
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const hipCenterY = (leftHip.y + rightHip.y) / 2;
  const torsoLength = Math.hypot(shoulderCenterX - hipCenterX, shoulderCenterY - hipCenterY);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const bodyWidth = Math.max(hipWidth, shoulderWidth * 0.5);
  if (torsoLength < 0.08 || bodyWidth < 0.035) return null;

  const leftArmLift = (leftShoulder.y - leftWrist.y) / torsoLength;
  const rightArmLift = (rightShoulder.y - rightWrist.y) / torsoLength;
  const legSpreadRatio = Math.abs(leftAnkle.x - rightAnkle.x) / bodyWidth;
  const armsOpen = leftArmLift >= ARM_OPEN_THRESHOLD && rightArmLift >= ARM_OPEN_THRESHOLD;
  const legsOpen = legSpreadRatio >= LEG_OPEN_THRESHOLD;
  const armsClosed = leftArmLift <= ARM_CLOSED_THRESHOLD && rightArmLift <= ARM_CLOSED_THRESHOLD;
  const legsClosed = legSpreadRatio <= LEG_CLOSED_THRESHOLD;

  return {
    leftArmLift,
    rightArmLift,
    legSpreadRatio,
    torsoLength,
    armsOpen,
    legsOpen,
    armsClosed,
    legsClosed,
  };
}

function isClosed(sample: Measurements) {
  return sample.armsClosed && sample.legsClosed;
}

function isOpen(sample: Measurements) {
  return sample.armsOpen && sample.legsOpen;
}

function getScore(sample: Measurements, phase: JumpingJackPhase) {
  const armProgress = clamp(
    ((sample.leftArmLift + sample.rightArmLift) / 2 / ARM_OPEN_THRESHOLD) * 100,
    0,
    100,
  );
  const legProgress = clamp((sample.legSpreadRatio / LEG_OPEN_THRESHOLD) * 100, 0, 100);
  const coordination = clamp(
    100 - Math.abs(sample.leftArmLift - sample.rightArmLift) * 100,
    0,
    100,
  );
  const completion = phase === 'open' || phase === 'closed' ? 100 : 75;
  return Math.round(
    armProgress * 0.35 + legProgress * 0.4 + coordination * 0.15 + completion * 0.1,
  );
}

function getFeedback(sample: Measurements, phase: JumpingJackPhase) {
  if (Math.abs(sample.leftArmLift - sample.rightArmLift) > 0.35) {
    return 'Keep your arms coordinated.';
  }
  if (phase === 'opening' && !sample.armsOpen) {
    return 'Raise your arms fully.';
  }
  if (phase === 'opening' && !sample.legsOpen) {
    return 'Spread your legs.';
  }
  if (phase === 'closing' || phase === 'open') return 'Return to the starting position.';
  return 'Good position. Begin your jumping jack when ready.';
}

export class JumpingJackDetector {
  private phase: JumpingJackPhase = 'waiting';
  private reps = 0;
  private samples: Measurements[] = [];
  private candidate: { phase: JumpingJackPhase; frames: number; startedAt: number } | null = null;
  private lastTimestamp: number | null = null;
  private completedOpen = false;

  reset() {
    this.phase = 'waiting';
    this.reps = 0;
    this.samples = [];
    this.candidate = null;
    this.lastTimestamp = null;
    this.completedOpen = false;
  }

  process(frame: PoseFrame, onDiagnostics?: DiagnosticsCallback): JumpingJackDetectionResult {
    const timestamp = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;
    if (this.lastTimestamp !== null && timestamp - this.lastTimestamp > TRACKING_LOSS_RESET_MS) {
      this.interruptCycle();
    }
    this.lastTimestamp = timestamp;
    const sample = measure(frame);
    if (!sample) {
      this.samples = [];
      this.interruptCycle();
      const result: JumpingJackDetectionResult = {
        phase: this.phase,
        reps: this.reps,
        feedback: 'Move into camera view and show your full body.',
        formScore: null,
        leftArmLift: null,
        rightArmLift: null,
        legSpreadRatio: null,
        tracking: false,
      };
      this.emitDiagnostics(frame, null, result, onDiagnostics);
      return result;
    }

    this.samples.push(sample);
    if (this.samples.length > 3) this.samples.shift();
    const filtered: Measurements = {
      leftArmLift: median(this.samples.map(item => item.leftArmLift)),
      rightArmLift: median(this.samples.map(item => item.rightArmLift)),
      legSpreadRatio: median(this.samples.map(item => item.legSpreadRatio)),
      torsoLength: median(this.samples.map(item => item.torsoLength)),
      armsOpen: false,
      legsOpen: false,
      armsClosed: false,
      legsClosed: false,
    };
    filtered.armsOpen =
      filtered.leftArmLift >= ARM_OPEN_THRESHOLD && filtered.rightArmLift >= ARM_OPEN_THRESHOLD;
    filtered.legsOpen = filtered.legSpreadRatio >= LEG_OPEN_THRESHOLD;
    filtered.armsClosed =
      filtered.leftArmLift <= ARM_CLOSED_THRESHOLD && filtered.rightArmLift <= ARM_CLOSED_THRESHOLD;
    filtered.legsClosed = filtered.legSpreadRatio <= LEG_CLOSED_THRESHOLD;
    this.advance(filtered, timestamp);
    const result: JumpingJackDetectionResult = {
      phase: this.phase,
      reps: this.reps,
      feedback: getFeedback(filtered, this.phase),
      formScore: getScore(filtered, this.phase),
      leftArmLift: Number(filtered.leftArmLift.toFixed(2)),
      rightArmLift: Number(filtered.rightArmLift.toFixed(2)),
      legSpreadRatio: Number(filtered.legSpreadRatio.toFixed(2)),
      tracking: true,
    };
    this.emitDiagnostics(frame, filtered, result, onDiagnostics);
    return result;
  }

  private emitDiagnostics(
    frame: PoseFrame,
    sample: Measurements | null,
    result: JumpingJackDetectionResult,
    callback?: DiagnosticsCallback,
  ) {
    if (!callback) return;
    const reliability = Object.fromEntries(
      Object.entries(LANDMARKS).map(([name, index]) => {
        const point = frame.landmarks[index];
        return [name, point ? confidence(point) : null];
      }),
    ) as JumpingJackDetectorDiagnostics['reliability'];
    callback({
      exerciseId: frame.exerciseId,
      phase: result.phase,
      candidatePhase: this.candidate?.phase ?? null,
      reps: result.reps,
      tracking: result.tracking,
      armsOpen: sample?.armsOpen ?? null,
      legsOpen: sample?.legsOpen ?? null,
      closedPosition: sample ? isClosed(sample) : null,
      leftArmLift: result.leftArmLift,
      rightArmLift: result.rightArmLift,
      legSpreadRatio: result.legSpreadRatio,
      torsoLength: sample ? Number(sample.torsoLength.toFixed(3)) : null,
      reliability,
      feedback: result.feedback,
      formScore: result.formScore,
    });
  }

  private interruptCycle() {
    this.phase = 'waiting';
    this.candidate = null;
    this.completedOpen = false;
  }

  private advance(sample: Measurements, timestamp: number) {
    let desired = this.phase;
    if (this.phase === 'waiting') {
      if (isClosed(sample)) desired = 'closed';
    } else if (this.phase === 'closed') {
      if (!sample.armsClosed || !sample.legsClosed) desired = 'opening';
    } else if (this.phase === 'opening') {
      if (isOpen(sample)) desired = 'open';
      else if (isClosed(sample)) desired = 'closed';
    } else if (this.phase === 'open') {
      if (!isOpen(sample)) desired = 'closing';
    } else if (this.phase === 'closing' && isClosed(sample)) {
      desired = 'closed';
    } else if (this.phase === 'closing' && isOpen(sample)) {
      desired = 'open';
    }

    if (desired === this.phase) {
      this.candidate = null;
      return;
    }
    if (this.candidate?.phase !== desired) {
      this.candidate = { phase: desired, frames: 1, startedAt: timestamp };
      return;
    }
    this.candidate.frames += 1;
    if (
      this.candidate.frames < MIN_PHASE_FRAMES ||
      timestamp - this.candidate.startedAt < MIN_PHASE_DURATION_MS
    ) {
      return;
    }
    const previous = this.phase;
    this.phase = desired;
    this.candidate = null;
    if (previous === 'opening' && desired === 'open') this.completedOpen = true;
    if (previous === 'closing' && desired === 'closed') {
      if (this.completedOpen) this.reps += 1;
      this.completedOpen = false;
    }
    if (previous === 'opening' && desired === 'closed') this.completedOpen = false;
  }
}
