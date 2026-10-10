import type { PoseFrame, PoseLandmark, PoseWorldLandmark } from './poseProcessing';

export type PushUpPhase = 'waiting' | 'top' | 'descending' | 'bottom' | 'ascending';

export interface PushUpDetectionResult {
  phase: PushUpPhase;
  reps: number;
  feedback: string;
  formScore: number | null;
  elbowAngle: number | null;
  bodyAlignment: number | null;
  tracking: boolean;
}

interface PushUpDiagnosticSide {
  reliable: boolean;
  elbowAngle: number | null;
  visibility: Record<'shoulder' | 'elbow' | 'wrist' | 'hip', number | null>;
  presence: Record<'shoulder' | 'elbow' | 'wrist' | 'hip', number | null>;
}

export interface PushUpDetectorDiagnostics {
  exerciseId: PoseFrame['exerciseId'];
  phase: PushUpPhase;
  candidatePhase: PushUpPhase | null;
  reps: number;
  tracking: boolean;
  selectedSide: 'left' | 'right' | null;
  left: PushUpDiagnosticSide;
  right: PushUpDiagnosticSide;
  bodyAlignment: number | null;
  feedback: string;
  formScore: number | null;
}

type DiagnosticsCallback = (diagnostics: PushUpDetectorDiagnostics) => void;

interface SidePose {
  shoulder: PoseLandmark;
  elbow: PoseLandmark;
  wrist: PoseLandmark;
  hip: PoseLandmark;
  ankle: PoseLandmark;
  worldShoulder: PoseWorldLandmark;
  worldElbow: PoseWorldLandmark;
  worldWrist: PoseWorldLandmark;
}

interface PoseSample {
  elbowAngle: number;
  bodyAlignment: number;
  elbowControl: number;
  side: 'left' | 'right';
}

interface SideDefinition {
  shoulder: number;
  elbow: number;
  wrist: number;
  hip: number;
  ankle: number;
}

const SIDE_INDICES: Record<'left' | 'right', SideDefinition> = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, ankle: 27 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, ankle: 28 },
};
const MIN_CONFIDENCE = 0.6;
const MIN_PHASE_FRAMES = 3;
const MIN_PHASE_DURATION_MS = 140;
const TRACKING_LOSS_RESET_MS = 600;

function confidence(point: PoseLandmark | PoseWorldLandmark) {
  return Math.min(point.visibility ?? 0, point.presence ?? point.visibility ?? 0);
}

function angleAtJoint(first: PoseWorldLandmark, joint: PoseWorldLandmark, last: PoseWorldLandmark) {
  const firstVector = [first.x - joint.x, first.y - joint.y, first.z - joint.z];
  const lastVector = [last.x - joint.x, last.y - joint.y, last.z - joint.z];
  const lengths = [Math.hypot(...firstVector), Math.hypot(...lastVector)];
  if (lengths.some(length => length === 0)) return null;
  const dot = firstVector.reduce((sum, value, index) => sum + value * lastVector[index], 0);
  const cosine = Math.max(-1, Math.min(1, dot / (lengths[0] * lengths[1])));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function getReliablePoint<T extends PoseLandmark | PoseWorldLandmark>(points: T[], index: number) {
  const point = points[index];
  if (!point || confidence(point) < MIN_CONFIDENCE) return null;
  if (![point.x, point.y, point.z].every(Number.isFinite)) return null;
  return point;
}

function readSide(frame: PoseFrame, side: 'left' | 'right'): SidePose | null {
  const indices = SIDE_INDICES[side];
  const shoulder = getReliablePoint(frame.landmarks, indices.shoulder);
  const elbow = getReliablePoint(frame.landmarks, indices.elbow);
  const wrist = getReliablePoint(frame.landmarks, indices.wrist);
  const hip = getReliablePoint(frame.landmarks, indices.hip);
  const ankle = getReliablePoint(frame.landmarks, indices.ankle);
  const worldShoulder = getReliablePoint(frame.worldLandmarks, indices.shoulder);
  const worldElbow = getReliablePoint(frame.worldLandmarks, indices.elbow);
  const worldWrist = getReliablePoint(frame.worldLandmarks, indices.wrist);
  if (
    !shoulder ||
    !elbow ||
    !wrist ||
    !hip ||
    !ankle ||
    !worldShoulder ||
    !worldElbow ||
    !worldWrist
  )
    return null;
  return {
    shoulder,
    elbow,
    wrist,
    hip,
    ankle,
    worldShoulder,
    worldElbow,
    worldWrist,
  };
}

function lineDistance(shoulder: PoseLandmark, hip: PoseLandmark, ankle: PoseLandmark) {
  const lineLength = Math.hypot(ankle.x - shoulder.x, ankle.y - shoulder.y);
  if (!lineLength) return Number.POSITIVE_INFINITY;
  return (
    Math.abs(
      (ankle.x - shoulder.x) * (shoulder.y - hip.y) - (shoulder.x - hip.x) * (ankle.y - shoulder.y),
    ) / lineLength
  );
}

function measureSide(pose: SidePose, side: 'left' | 'right'): PoseSample | null {
  const elbowAngle = angleAtJoint(pose.worldShoulder, pose.worldElbow, pose.worldWrist);
  if (elbowAngle === null) return null;
  return {
    elbowAngle,
    bodyAlignment: lineDistance(pose.shoulder, pose.hip, pose.ankle),
    elbowControl: Math.abs(pose.elbow.x - pose.shoulder.x),
    side,
  };
}

function diagnosticSide(frame: PoseFrame, side: 'left' | 'right'): PushUpDiagnosticSide {
  const indices = SIDE_INDICES[side];
  const normalized = {
    shoulder: frame.landmarks[indices.shoulder],
    elbow: frame.landmarks[indices.elbow],
    wrist: frame.landmarks[indices.wrist],
    hip: frame.landmarks[indices.hip],
  };
  const pose = readSide(frame, side);
  return {
    reliable: pose !== null,
    elbowAngle: pose ? angleAtJoint(pose.worldShoulder, pose.worldElbow, pose.worldWrist) : null,
    visibility: Object.fromEntries(
      Object.entries(normalized).map(([key, point]) => [key, point?.visibility ?? null]),
    ) as PushUpDiagnosticSide['visibility'],
    presence: Object.fromEntries(
      Object.entries(normalized).map(([key, point]) => [key, point?.presence ?? null]),
    ) as PushUpDiagnosticSide['presence'],
  };
}

function median(values: number[]) {
  const ordered = [...values].sort((first, second) => first - second);
  return ordered[Math.floor(ordered.length / 2)];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function estimateScore(sample: PoseSample, phase: PushUpPhase) {
  const extension = clamp(((sample.elbowAngle - 90) / 80) * 100, 0, 100);
  const alignment = clamp(100 - sample.bodyAlignment * 400, 0, 100);
  const control = clamp(100 - Math.max(0, sample.elbowControl - 0.2) * 180, 0, 100);
  const completion = phase === 'ascending' && sample.elbowAngle < 150 ? 70 : 100;
  return Math.round(extension * 0.35 + alignment * 0.4 + control * 0.15 + completion * 0.1);
}

function getFeedback(sample: PoseSample, phase: PushUpPhase) {
  if (sample.bodyAlignment > 0.12) return 'Keep your body straight.';
  if (sample.elbowAngle < 75) return 'Keep your elbows controlled.';
  if (phase === 'descending' || phase === 'bottom') return 'Go lower.';
  if (phase === 'ascending' || sample.elbowAngle < 155) return 'Fully extend your arms.';
  return 'Good position. Begin your push-up when ready.';
}

export class PushUpDetector {
  private phase: PushUpPhase = 'waiting';
  private reps = 0;
  private samples: PoseSample[] = [];
  private candidate: { phase: PushUpPhase; frames: number; startedAt: number } | null = null;
  private lastTimestamp: number | null = null;
  private invalidSince: number | null = null;
  private lowestElbowAngle = Number.POSITIVE_INFINITY;
  private cycleCompletedBottom = false;

  reset() {
    this.phase = 'waiting';
    this.reps = 0;
    this.samples = [];
    this.candidate = null;
    this.lastTimestamp = null;
    this.invalidSince = null;
    this.lowestElbowAngle = Number.POSITIVE_INFINITY;
    this.cycleCompletedBottom = false;
  }

  process(frame: PoseFrame, onDiagnostics?: DiagnosticsCallback): PushUpDetectionResult {
    const timestamp = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;
    if (this.lastTimestamp !== null && timestamp - this.lastTimestamp > TRACKING_LOSS_RESET_MS) {
      this.interruptCycle();
    }
    this.lastTimestamp = timestamp;

    const sideSamples = (['left', 'right'] as const)
      .map(side => {
        const pose = readSide(frame, side);
        return pose ? measureSide(pose, side) : null;
      })
      .filter((sample): sample is PoseSample => sample !== null);
    const sample = sideSamples.sort((first, second) => {
      const firstConfidence = Math.min(
        ...Object.values(diagnosticSide(frame, first.side).visibility).filter(
          (value): value is number => value !== null,
        ),
      );
      const secondConfidence = Math.min(
        ...Object.values(diagnosticSide(frame, second.side).visibility).filter(
          (value): value is number => value !== null,
        ),
      );
      return secondConfidence - firstConfidence;
    })[0];

    if (!sample) {
      this.candidate = null;
      this.samples = [];
      this.invalidSince ??= timestamp;
      if (timestamp - this.invalidSince >= TRACKING_LOSS_RESET_MS) this.interruptCycle();
      const result: PushUpDetectionResult = {
        phase: this.phase,
        reps: this.reps,
        feedback: frame.landmarks.length
          ? 'Move into camera view and show your full body.'
          : 'Move into camera view.',
        formScore: null,
        elbowAngle: null,
        bodyAlignment: null,
        tracking: false,
      };
      this.emitDiagnostics(frame, null, result, onDiagnostics);
      return result;
    }

    if (this.invalidSince !== null) {
      this.interruptCycle();
      this.invalidSince = null;
    }
    this.samples.push(sample);
    if (this.samples.length > 3) this.samples.shift();
    const filtered: PoseSample = {
      ...sample,
      elbowAngle: median(this.samples.map(item => item.elbowAngle)),
      bodyAlignment: median(this.samples.map(item => item.bodyAlignment)),
      elbowControl: median(this.samples.map(item => item.elbowControl)),
    };
    this.advance(filtered, timestamp);
    const result: PushUpDetectionResult = {
      phase: this.phase,
      reps: this.reps,
      feedback: getFeedback(filtered, this.phase),
      formScore: estimateScore(filtered, this.phase),
      elbowAngle: Math.round(filtered.elbowAngle),
      bodyAlignment: Number(filtered.bodyAlignment.toFixed(3)),
      tracking: true,
    };
    this.emitDiagnostics(frame, sample, result, onDiagnostics);
    return result;
  }

  private emitDiagnostics(
    frame: PoseFrame,
    sample: PoseSample | null,
    result: PushUpDetectionResult,
    callback?: DiagnosticsCallback,
  ) {
    callback?.({
      exerciseId: frame.exerciseId,
      phase: result.phase,
      candidatePhase: this.candidate?.phase ?? null,
      reps: result.reps,
      tracking: result.tracking,
      selectedSide: sample?.side ?? null,
      left: diagnosticSide(frame, 'left'),
      right: diagnosticSide(frame, 'right'),
      bodyAlignment: result.bodyAlignment,
      feedback: result.feedback,
      formScore: result.formScore,
    });
  }

  private interruptCycle() {
    this.phase = 'waiting';
    this.candidate = null;
    this.samples = [];
    this.lowestElbowAngle = Number.POSITIVE_INFINITY;
    this.cycleCompletedBottom = false;
  }

  private advance(sample: PoseSample, timestamp: number) {
    const atTop = sample.elbowAngle >= 155;
    const nearBottom = sample.elbowAngle <= 105;
    let desired = this.phase;

    if (this.phase === 'waiting') {
      if (atTop) desired = 'top';
    } else if (this.phase === 'top') {
      if (sample.elbowAngle <= 140) desired = 'descending';
    } else if (this.phase === 'descending') {
      if (nearBottom) desired = 'bottom';
      else if (atTop) desired = 'top';
    } else if (this.phase === 'bottom') {
      this.lowestElbowAngle = Math.min(this.lowestElbowAngle, sample.elbowAngle);
      if (sample.elbowAngle >= this.lowestElbowAngle + 15 || sample.elbowAngle >= 150) {
        desired = 'ascending';
      }
    } else if (this.phase === 'ascending' && atTop) {
      desired = 'top';
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
    )
      return;

    const previous = this.phase;
    this.phase = desired;
    this.candidate = null;
    if (previous === 'descending' && desired === 'bottom') {
      this.lowestElbowAngle = sample.elbowAngle;
      this.cycleCompletedBottom = true;
    }
    if (previous === 'ascending' && desired === 'top') {
      if (this.cycleCompletedBottom) this.reps += 1;
      this.cycleCompletedBottom = false;
      this.lowestElbowAngle = Number.POSITIVE_INFINITY;
    }
    if (previous === 'descending' && desired === 'top') {
      this.cycleCompletedBottom = false;
      this.lowestElbowAngle = Number.POSITIVE_INFINITY;
    }
  }
}
