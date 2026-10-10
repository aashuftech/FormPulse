import type { PoseFrame, PoseLandmark, PoseWorldLandmark } from './poseProcessing';

export type PlankPhase = 'invalid' | 'entering' | 'holding';

export interface PlankDetectionResult {
  phase: PlankPhase;
  holding: boolean;
  validDurationSeconds: number;
  targetReached: boolean;
  feedback: string;
  formScore: number | null;
  hipAlignmentError: number | null;
  hipAngle: number | null;
  elbowAngle: number | null;
  tracking: boolean;
}

export interface PlankDetectorDiagnostics {
  exerciseId: PoseFrame['exerciseId'];
  phase: PlankPhase;
  candidatePhase: PlankPhase | null;
  holding: boolean;
  validDurationSeconds: number;
  targetReached: boolean;
  side: 'left' | 'right' | null;
  hipAlignmentError: number | null;
  signedHipOffset: number | null;
  hipAngle: number | null;
  bodyVerticalRatio: number | null;
  elbowAngle: number | null;
  kneeAngle: number | null;
  reliability: Record<'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle', number | null>;
  feedback: string;
  formScore: number | null;
}

type DiagnosticsCallback = (diagnostics: PlankDetectorDiagnostics) => void;
type Landmark = PoseLandmark | PoseWorldLandmark;
type Side = 'left' | 'right';

interface SidePose {
  side: Side;
  confidence: number;
  normalized: Record<'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle', PoseLandmark>;
  world: Record<'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle', PoseWorldLandmark>;
}

interface Measurement {
  side: Side;
  confidence: number;
  hipAlignmentError: number;
  signedHipOffset: number;
  hipAngle: number;
  bodyVerticalRatio: number;
  elbowAngle: number;
  kneeAngle: number;
  valid: boolean;
}

const SIDE_INDICES: Record<
  Side,
  Record<'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle', number>
> = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 },
};
const MIN_CONFIDENCE = 0.6;
const ENTRY_FRAMES = 4;
const ENTRY_DURATION_MS = 240;
const INVALID_GRACE_MS = 400;
const MAX_COUNTED_FRAME_GAP_MS = 250;

function confidence(point: Landmark) {
  return Math.min(point.visibility ?? point.presence ?? 0, point.presence ?? point.visibility ?? 0);
}

function reliable<T extends Landmark>(points: T[], index: number) {
  const point = points[index];
  if (!point || confidence(point) < MIN_CONFIDENCE) return null;
  return [point.x, point.y, point.z].every(Number.isFinite) ? point : null;
}

function readSide(frame: PoseFrame, side: Side): SidePose | null {
  const indices = SIDE_INDICES[side];
  const normalized = Object.fromEntries(
    Object.entries(indices).map(([name, index]) => [name, reliable(frame.landmarks, index)]),
  );
  const world = Object.fromEntries(
    Object.entries(indices).map(([name, index]) => [name, reliable(frame.worldLandmarks, index)]),
  );
  if (
    Object.values(normalized).some(point => point === null) ||
    Object.values(world).some(point => point === null)
  )
    return null;
  const normalizedPoints = normalized as SidePose['normalized'];
  const worldPoints = world as SidePose['world'];
  const visibility = Object.values(normalizedPoints).map(confidence);
  return {
    side,
    confidence: Math.min(...visibility),
    normalized: normalizedPoints,
    world: worldPoints,
  };
}

function angleAtJoint(first: Landmark, joint: Landmark, last: Landmark) {
  const a = [first.x - joint.x, first.y - joint.y, first.z - joint.z];
  const b = [last.x - joint.x, last.y - joint.y, last.z - joint.z];
  const lengths = [Math.hypot(...a), Math.hypot(...b)];
  if (lengths.some(length => length === 0)) return null;
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  return (Math.acos(Math.max(-1, Math.min(1, dot / (lengths[0] * lengths[1])))) * 180) / Math.PI;
}

function measure(pose: SidePose): Measurement | null {
  const { shoulder, hip, ankle } = pose.world;
  const hipAngle = angleAtJoint(shoulder, hip, ankle);
  const elbowAngle = angleAtJoint(pose.world.shoulder, pose.world.elbow, pose.world.wrist);
  const kneeAngle = angleAtJoint(pose.world.hip, pose.world.knee, pose.world.ankle);
  if (hipAngle === null || elbowAngle === null || kneeAngle === null) return null;
  const body = [ankle.x - shoulder.x, ankle.y - shoulder.y, ankle.z - shoulder.z];
  const bodyLength = Math.hypot(...body);
  if (bodyLength < 0.2) return null;
  const hipVector = [hip.x - shoulder.x, hip.y - shoulder.y, hip.z - shoulder.z];
  const projection = Math.max(
    0,
    Math.min(
      1,
      body.reduce((sum, value, index) => sum + value * hipVector[index], 0) / bodyLength ** 2,
    ),
  );
  const residual = hipVector.map((value, index) => value - body[index] * projection);
  const hipAlignmentError = Math.hypot(...residual) / bodyLength;
  const signedHipOffset = residual[1] / bodyLength;
  const bodyVerticalRatio = Math.abs(body[1]) / bodyLength;
  const valid =
    hipAngle >= 155 &&
    hipAlignmentError <= 0.12 &&
    bodyVerticalRatio <= 0.5 &&
    elbowAngle >= 60 &&
    elbowAngle <= 140 &&
    kneeAngle >= 150;
  return {
    side: pose.side,
    confidence: pose.confidence,
    hipAlignmentError,
    signedHipOffset,
    hipAngle,
    bodyVerticalRatio,
    elbowAngle,
    kneeAngle,
    valid,
  };
}

function median(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

function smooth(samples: Measurement[]) {
  const latest = samples[samples.length - 1];
  return {
    ...latest,
    hipAlignmentError: median(samples.map(sample => sample.hipAlignmentError)),
    signedHipOffset: median(samples.map(sample => sample.signedHipOffset)),
    hipAngle: median(samples.map(sample => sample.hipAngle)),
    bodyVerticalRatio: median(samples.map(sample => sample.bodyVerticalRatio)),
    elbowAngle: median(samples.map(sample => sample.elbowAngle)),
    kneeAngle: median(samples.map(sample => sample.kneeAngle)),
    valid: latest.valid && samples.filter(sample => sample.valid).length >= 2,
  };
}

function score(sample: Measurement) {
  const alignment = Math.max(0, 100 - sample.hipAlignmentError * 650);
  const hipExtension = Math.max(0, 100 - Math.abs(180 - sample.hipAngle) * 2.2);
  const elbowStability = Math.max(0, 100 - Math.max(0, Math.abs(sample.elbowAngle - 95) - 20) * 2);
  const horizontal = Math.max(0, 100 - sample.bodyVerticalRatio * 150);
  return Math.round(
    alignment * 0.4 + hipExtension * 0.25 + elbowStability * 0.2 + horizontal * 0.15,
  );
}

function getFeedback(sample: Measurement | null, tracking: boolean) {
  if (!tracking || !sample) return 'Move into camera view and show your full body.';
  if (sample.signedHipOffset > 0.1) return 'Raise your hips slightly.';
  if (sample.signedHipOffset < -0.1) return 'Lower your hips.';
  if (
    sample.hipAlignmentError > 0.12 ||
    sample.bodyVerticalRatio > 0.5 ||
    sample.hipAngle < 155 ||
    sample.kneeAngle < 150
  ) {
    return 'Keep your body straight.';
  }
  if (sample.elbowAngle < 60 || sample.elbowAngle > 140) return 'Keep your elbows stable.';
  return 'Keep your core engaged.';
}

export class PlankDetector {
  private phase: PlankPhase = 'invalid';
  private samples: Measurement[] = [];
  private candidate: { frames: number; startedAt: number } | null = null;
  private lastTimestamp: number | null = null;
  private lastValidTimestamp: number | null = null;
  private invalidSince: number | null = null;
  private validMilliseconds = 0;

  reset() {
    this.phase = 'invalid';
    this.samples = [];
    this.candidate = null;
    this.lastTimestamp = null;
    this.lastValidTimestamp = null;
    this.invalidSince = null;
    this.validMilliseconds = 0;
  }

  process(
    frame: PoseFrame,
    targetDurationSeconds?: number,
    onDiagnostics?: DiagnosticsCallback,
  ): PlankDetectionResult {
    const timestamp = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;
    const isNewTimestamp = this.lastTimestamp === null || timestamp > this.lastTimestamp;
    if (isNewTimestamp) {
      if (
        this.lastTimestamp !== null &&
        timestamp - this.lastTimestamp > MAX_COUNTED_FRAME_GAP_MS &&
        this.phase === 'entering'
      ) {
        this.phase = 'invalid';
        this.candidate = null;
        this.samples = [];
      }
      this.lastTimestamp = timestamp;
    }

    const poses = (['left', 'right'] as const)
      .map(side => readSide(frame, side))
      .filter((pose): pose is SidePose => pose !== null);
    const rawMeasurement = poses
      .map(measure)
      .filter((item): item is Measurement => item !== null)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (!rawMeasurement) {
      this.samples = [];
      if (isNewTimestamp) this.handleInvalid(timestamp);
      const result = this.createResult(null, false, targetDurationSeconds);
      this.emitDiagnostics(frame, null, result, onDiagnostics);
      return result;
    }

    if (!isNewTimestamp) {
      const result = this.createResult(rawMeasurement, true, targetDurationSeconds);
      this.emitDiagnostics(frame, rawMeasurement, result, onDiagnostics);
      return result;
    }

    this.samples.push(rawMeasurement);
    if (this.samples.length > 3) this.samples.shift();
    const sample = smooth(this.samples);
    if (this.phase === 'holding' && sample.valid) {
      if (this.invalidSince !== null) this.invalidSince = null;
      if (this.lastValidTimestamp !== null) {
        const delta = timestamp - this.lastValidTimestamp;
        if (delta > 0 && delta <= MAX_COUNTED_FRAME_GAP_MS) this.validMilliseconds += delta;
      }
      this.lastValidTimestamp = timestamp;
    } else if (this.phase === 'holding') {
      this.handleInvalid(timestamp);
    } else if (sample.valid) {
      this.advanceEntry(timestamp);
    } else {
      this.phase = 'invalid';
      this.candidate = null;
      this.lastValidTimestamp = null;
    }

    const result = this.createResult(sample, true, targetDurationSeconds);
    this.emitDiagnostics(frame, sample, result, onDiagnostics);
    return result;
  }

  private handleInvalid(timestamp: number) {
    this.lastValidTimestamp = null;
    if (this.phase === 'entering') {
      this.phase = 'invalid';
      this.candidate = null;
      this.invalidSince = null;
      return;
    }
    if (this.phase !== 'holding') return;
    this.invalidSince ??= timestamp;
    if (timestamp - this.invalidSince >= INVALID_GRACE_MS) {
      this.phase = 'invalid';
      this.candidate = null;
      this.invalidSince = null;
    }
  }

  private advanceEntry(timestamp: number) {
    this.invalidSince = null;
    if (this.phase === 'invalid') {
      this.phase = 'entering';
      this.candidate = { frames: 1, startedAt: timestamp };
      return;
    }
    if (this.phase !== 'entering') return;
    if (!this.candidate) this.candidate = { frames: 1, startedAt: timestamp };
    else this.candidate.frames += 1;
    if (
      this.candidate.frames >= ENTRY_FRAMES &&
      timestamp - this.candidate.startedAt >= ENTRY_DURATION_MS
    ) {
      this.phase = 'holding';
      this.candidate = null;
      this.lastValidTimestamp = timestamp;
    }
  }

  private createResult(
    sample: Measurement | null,
    tracking: boolean,
    targetDurationSeconds?: number,
  ): PlankDetectionResult {
    const validDurationSeconds = Number((this.validMilliseconds / 1000).toFixed(2));
    const targetReached =
      Number.isFinite(targetDurationSeconds) &&
      (targetDurationSeconds ?? 0) > 0 &&
      this.validMilliseconds >= (targetDurationSeconds ?? Number.POSITIVE_INFINITY) * 1000;
    return {
      phase: this.phase,
      holding: this.phase === 'holding' && Boolean(sample?.valid),
      validDurationSeconds,
      targetReached,
      feedback: getFeedback(sample, tracking),
      formScore: tracking && sample ? score(sample) : null,
      hipAlignmentError: sample ? Number(sample.hipAlignmentError.toFixed(3)) : null,
      hipAngle: sample ? Math.round(sample.hipAngle) : null,
      elbowAngle: sample ? Math.round(sample.elbowAngle) : null,
      tracking,
    };
  }

  private emitDiagnostics(
    frame: PoseFrame,
    measurement: Measurement | null,
    result: PlankDetectionResult,
    callback?: DiagnosticsCallback,
  ) {
    if (!callback) return;
    const sides: Side[] = ['left', 'right'];
    const diagnosticSide =
      measurement?.side ??
      sides.sort((a, b) => {
        const confidenceFor = (side: Side) =>
          Object.values(SIDE_INDICES[side]).reduce((sum, index) => {
            const point = frame.landmarks[index];
            return sum + (point ? confidence(point) : 0);
          }, 0);
        return confidenceFor(b) - confidenceFor(a);
      })[0];
    const indices = diagnosticSide ? SIDE_INDICES[diagnosticSide] : null;
    const reliability = Object.fromEntries(
      (['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'] as const).map(name => {
        const point = indices ? frame.landmarks[indices[name]] : undefined;
        return [name, point ? confidence(point) : null];
      }),
    ) as PlankDetectorDiagnostics['reliability'];
    callback({
      exerciseId: frame.exerciseId,
      phase: result.phase,
      candidatePhase: this.candidate ? 'entering' : null,
      holding: result.holding,
      validDurationSeconds: result.validDurationSeconds,
      targetReached: result.targetReached,
      side: diagnosticSide ?? null,
      hipAlignmentError: result.hipAlignmentError,
      signedHipOffset: measurement ? Number(measurement.signedHipOffset.toFixed(3)) : null,
      hipAngle: result.hipAngle,
      bodyVerticalRatio: measurement ? Number(measurement.bodyVerticalRatio.toFixed(3)) : null,
      elbowAngle: result.elbowAngle,
      kneeAngle: measurement ? Math.round(measurement.kneeAngle) : null,
      reliability,
      feedback: result.feedback,
      formScore: result.formScore,
    });
  }
}
