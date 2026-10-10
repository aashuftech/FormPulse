import type { PoseFrame, PoseLandmark, PoseWorldLandmark } from './poseProcessing';

export type SquatPhase = 'waiting' | 'standing' | 'descending' | 'bottom' | 'ascending';

export interface SquatDetectionResult {
  phase: SquatPhase;
  reps: number;
  feedback: string;
  formScore: number | null;
  hipAngle: number | null;
  kneeAngle: number | null;
  tracking: boolean;
}

interface SquatDiagnosticLandmark extends PoseLandmark {
  detectorConfidence: number;
}

export interface SquatDetectorDiagnostics {
  exerciseId: PoseFrame['exerciseId'];
  coordinateUse: {
    hipAndKneeAngles: 'worldLandmarks';
    torsoLeanAndKneeAlignment: 'normalizedLandmarks';
  };
  landmarkIndices: typeof LANDMARK_INDICES;
  left: {
    reliable: boolean;
    hipAngle: number | null;
    kneeAngle: number | null;
    normalizedLandmarks: Record<
      'shoulder' | 'hip' | 'knee' | 'ankle',
      SquatDiagnosticLandmark | null
    >;
    worldLandmarks: Record<'shoulder' | 'hip' | 'knee' | 'ankle', SquatDiagnosticLandmark | null>;
  };
  right: {
    reliable: boolean;
    hipAngle: number | null;
    kneeAngle: number | null;
    normalizedLandmarks: Record<
      'shoulder' | 'hip' | 'knee' | 'ankle',
      SquatDiagnosticLandmark | null
    >;
    worldLandmarks: Record<'shoulder' | 'hip' | 'knee' | 'ankle', SquatDiagnosticLandmark | null>;
  };
  reliable: boolean;
  selectedSide: 'left' | 'right' | null;
  phase: SquatPhase;
  candidatePhase: SquatPhase | null;
  candidateFrames: number;
  candidateElapsedMs: number;
  cycleInterrupted: boolean;
  reps: number;
  feedback: string;
  formScore: number | null;
}

type SquatDiagnosticsCallback = (diagnostics: SquatDetectorDiagnostics) => void;

interface JointSample {
  hipAngle: number;
  kneeAngle: number;
  torsoLean: number;
  kneeAlignment: boolean | null;
}

interface SquatCycleMetrics {
  lowestKneeAngle: number;
  highestTorsoLean: number;
  kneesMisaligned: boolean;
}

interface SideJoints {
  shoulder: PoseLandmark;
  hip: PoseLandmark;
  knee: PoseLandmark;
  ankle: PoseLandmark;
  worldShoulder: PoseWorldLandmark;
  worldHip: PoseWorldLandmark;
  worldKnee: PoseWorldLandmark;
  worldAnkle: PoseWorldLandmark;
}

const MIN_VISIBILITY = 0.6;
const MIN_PHASE_FRAMES = 3;
const MIN_PHASE_DURATION_MS = 140;
const TRACKING_LOSS_RESET_MS = 600;
const LANDMARK_INDICES = {
  left: { shoulder: 11, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, hip: 24, knee: 26, ankle: 28 },
} as const;

function confidenceOf(landmark: PoseLandmark | PoseWorldLandmark) {
  const visibility = landmark.visibility ?? 0;
  // MediaPipe Tasks Vision returns visibility for world landmarks and may omit presence.
  const presence = landmark.presence ?? visibility;
  return Math.min(visibility, presence);
}

function angleAtJoint(first: PoseWorldLandmark, joint: PoseWorldLandmark, last: PoseWorldLandmark) {
  const firstVector = [first.x - joint.x, first.y - joint.y, first.z - joint.z];
  const lastVector = [last.x - joint.x, last.y - joint.y, last.z - joint.z];
  const firstLength = Math.hypot(...firstVector);
  const lastLength = Math.hypot(...lastVector);
  if (!firstLength || !lastLength) return null;
  const dot = firstVector.reduce((sum, value, index) => sum + value * lastVector[index], 0);
  const cosine = Math.max(-1, Math.min(1, dot / (firstLength * lastLength)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function getLandmark<T extends PoseLandmark | PoseWorldLandmark>(points: T[], index: number) {
  const point = points[index];
  if (!point || confidenceOf(point) < MIN_VISIBILITY) return null;
  if (![point.x, point.y, point.z].every(Number.isFinite)) return null;
  return point;
}

function readSide(frame: PoseFrame, side: keyof typeof LANDMARK_INDICES): SideJoints | null {
  const indexes = LANDMARK_INDICES[side];
  const shoulder = getLandmark(frame.landmarks, indexes.shoulder);
  const hip = getLandmark(frame.landmarks, indexes.hip);
  const knee = getLandmark(frame.landmarks, indexes.knee);
  const ankle = getLandmark(frame.landmarks, indexes.ankle);
  const worldShoulder = getLandmark(frame.worldLandmarks, indexes.shoulder);
  const worldHip = getLandmark(frame.worldLandmarks, indexes.hip);
  const worldKnee = getLandmark(frame.worldLandmarks, indexes.knee);
  const worldAnkle = getLandmark(frame.worldLandmarks, indexes.ankle);
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

function diagnosticLandmark(
  point?: PoseLandmark | PoseWorldLandmark,
): SquatDiagnosticLandmark | null {
  return point ? { ...point, detectorConfidence: confidenceOf(point) } : null;
}

function getSideDiagnostics(frame: PoseFrame, side: keyof typeof LANDMARK_INDICES) {
  const indexes = LANDMARK_INDICES[side];
  const joints = readSide(frame, side);
  const hipAngle = joints
    ? angleAtJoint(joints.worldShoulder, joints.worldHip, joints.worldKnee)
    : null;
  const kneeAngle = joints
    ? angleAtJoint(joints.worldHip, joints.worldKnee, joints.worldAnkle)
    : null;
  return {
    reliable: joints !== null && hipAngle !== null && kneeAngle !== null,
    hipAngle,
    kneeAngle,
    normalizedLandmarks: {
      shoulder: diagnosticLandmark(frame.landmarks[indexes.shoulder]),
      hip: diagnosticLandmark(frame.landmarks[indexes.hip]),
      knee: diagnosticLandmark(frame.landmarks[indexes.knee]),
      ankle: diagnosticLandmark(frame.landmarks[indexes.ankle]),
    },
    worldLandmarks: {
      shoulder: diagnosticLandmark(frame.worldLandmarks[indexes.shoulder]),
      hip: diagnosticLandmark(frame.worldLandmarks[indexes.hip]),
      knee: diagnosticLandmark(frame.worldLandmarks[indexes.knee]),
      ankle: diagnosticLandmark(frame.worldLandmarks[indexes.ankle]),
    },
  };
}

function getSelectedSide(frame: PoseFrame): 'left' | 'right' | null {
  const availableSides = (['left', 'right'] as const)
    .map(side => ({ side, joints: readSide(frame, side) }))
    .filter((side): side is { side: 'left' | 'right'; joints: SideJoints } => side.joints !== null);
  if (availableSides.length === 0) return null;
  const confidence = (side: SideJoints) =>
    Math.min(
      confidenceOf(side.shoulder),
      confidenceOf(side.hip),
      confidenceOf(side.knee),
      confidenceOf(side.ankle),
    );
  return availableSides.reduce((best, current) =>
    confidence(current.joints) > confidence(best.joints) ? current : best,
  ).side;
}

function torsoLean(shoulder: PoseLandmark, hip: PoseLandmark) {
  const vertical = Math.abs(shoulder.y - hip.y);
  if (vertical < 0.01) return 90;
  return (Math.atan2(Math.abs(shoulder.x - hip.x), vertical) * 180) / Math.PI;
}

function readKneeAlignment(frame: PoseFrame) {
  const leftKnee = getLandmark(frame.landmarks, LANDMARK_INDICES.left.knee);
  const rightKnee = getLandmark(frame.landmarks, LANDMARK_INDICES.right.knee);
  const leftAnkle = getLandmark(frame.landmarks, LANDMARK_INDICES.left.ankle);
  const rightAnkle = getLandmark(frame.landmarks, LANDMARK_INDICES.right.ankle);
  if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return null;
  const ankleSpan = Math.abs(leftAnkle.x - rightAnkle.x);
  if (ankleSpan < 0.08) return null;
  const kneeSpan = Math.abs(leftKnee.x - rightKnee.x);
  return kneeSpan / ankleSpan < 0.55;
}

function median(values: number[]) {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function isNearFrameEdge(frame: PoseFrame) {
  const keyPoints = [11, 12, 23, 24, 25, 26, 27, 28]
    .map(index => frame.landmarks[index])
    .filter(Boolean);
  return keyPoints.some(
    point => point.x < 0.03 || point.x > 0.97 || point.y < 0.03 || point.y > 0.97,
  );
}

function unavailableFeedback(frame: PoseFrame) {
  if (frame.landmarks.length === 0) return 'Move into camera view.';
  return isNearFrameEdge(frame)
    ? 'Step back so your full body is in view.'
    : 'Move into camera view.';
}

function getSample(frame: PoseFrame): JointSample | null {
  const sides = (['left', 'right'] as const)
    .map(side => readSide(frame, side))
    .filter((side): side is SideJoints => side !== null);
  if (sides.length === 0) return null;
  const side = sides.reduce((best, current) => {
    const bestConfidence = Math.min(
      confidenceOf(best.shoulder),
      confidenceOf(best.hip),
      confidenceOf(best.knee),
      confidenceOf(best.ankle),
    );
    const currentConfidence = Math.min(
      confidenceOf(current.shoulder),
      confidenceOf(current.hip),
      confidenceOf(current.knee),
      confidenceOf(current.ankle),
    );
    return currentConfidence > bestConfidence ? current : best;
  });
  const hipAngle = angleAtJoint(side.worldShoulder, side.worldHip, side.worldKnee);
  const kneeAngle = angleAtJoint(side.worldHip, side.worldKnee, side.worldAnkle);
  if (hipAngle === null || kneeAngle === null) return null;
  return {
    hipAngle,
    kneeAngle,
    torsoLean: torsoLean(side.shoulder, side.hip),
    kneeAlignment: readKneeAlignment(frame),
  };
}

function estimatedScore(sample: JointSample, phase: SquatPhase) {
  const depth = clamp(((170 - sample.kneeAngle) / 75) * 100, 0, 100);
  const back = clamp(100 - Math.max(0, sample.torsoLean - 25) * 2, 0, 100);
  const knees = sample.kneeAlignment === true ? 55 : 100;
  const extension = phase === 'ascending' && sample.kneeAngle < 160 ? 70 : 100;
  return Math.round(depth * 0.35 + back * 0.3 + knees * 0.2 + extension * 0.15);
}

function estimatedCycleScore(metrics: SquatCycleMetrics) {
  const depth = clamp(((170 - metrics.lowestKneeAngle) / 75) * 100, 0, 100);
  const back = clamp(100 - Math.max(0, metrics.highestTorsoLean - 25) * 2, 0, 100);
  const knees = metrics.kneesMisaligned ? 55 : 100;
  return Math.round(depth * 0.35 + back * 0.35 + knees * 0.3);
}

function emptyCycleMetrics(): SquatCycleMetrics {
  return {
    lowestKneeAngle: Number.POSITIVE_INFINITY,
    highestTorsoLean: 0,
    kneesMisaligned: false,
  };
}

function getFeedback(sample: JointSample, phase: SquatPhase) {
  if (sample.torsoLean > 50) return 'Keep your back straight.';
  if (sample.kneeAlignment === true && sample.kneeAngle < 155) return 'Keep your knees aligned.';
  if (phase === 'ascending' && sample.kneeAngle < 160) return 'Stand fully.';
  if (phase === 'descending' || (phase === 'bottom' && sample.kneeAngle > 105)) {
    return 'Go lower.';
  }
  if (phase === 'bottom') return 'Good depth. Stand up steadily.';
  if (phase === 'waiting') return 'Stand fully to begin.';
  return 'Good position. Begin your squat when ready.';
}

export class SquatDetector {
  private phase: SquatPhase = 'waiting';
  private reps = 0;
  private samples: JointSample[] = [];
  private candidate: { phase: SquatPhase; frames: number; startedAt: number } | null = null;
  private lastTimestamp: number | null = null;
  private invalidSince: number | null = null;
  private cycleInterrupted = false;
  private lowestKneeAngle = Number.POSITIVE_INFINITY;
  private cycleMetrics = emptyCycleMetrics();

  reset() {
    this.phase = 'waiting';
    this.reps = 0;
    this.samples = [];
    this.candidate = null;
    this.lastTimestamp = null;
    this.invalidSince = null;
    this.cycleInterrupted = false;
    this.lowestKneeAngle = Number.POSITIVE_INFINITY;
    this.cycleMetrics = emptyCycleMetrics();
  }

  process(frame: PoseFrame, onDiagnostics?: SquatDiagnosticsCallback): SquatDetectionResult {
    const timestamp = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;
    if (this.lastTimestamp !== null && timestamp - this.lastTimestamp > TRACKING_LOSS_RESET_MS) {
      this.interruptCycle();
    }
    this.lastTimestamp = timestamp;

    const sample = getSample(frame);
    if (!sample) {
      this.candidate = null;
      this.samples = [];
      this.invalidSince ??= timestamp;
      this.cycleInterrupted = true;
      if (timestamp - this.invalidSince >= TRACKING_LOSS_RESET_MS) this.interruptCycle();
      const result = {
        phase: this.phase,
        reps: this.reps,
        feedback: unavailableFeedback(frame),
        formScore: null,
        hipAngle: null,
        kneeAngle: null,
        tracking: false,
      };
      onDiagnostics?.({
        exerciseId: frame.exerciseId,
        coordinateUse: {
          hipAndKneeAngles: 'worldLandmarks',
          torsoLeanAndKneeAlignment: 'normalizedLandmarks',
        },
        landmarkIndices: LANDMARK_INDICES,
        left: getSideDiagnostics(frame, 'left'),
        right: getSideDiagnostics(frame, 'right'),
        reliable: false,
        selectedSide: null,
        phase: result.phase,
        candidatePhase: null,
        candidateFrames: 0,
        candidateElapsedMs: 0,
        cycleInterrupted: this.cycleInterrupted,
        reps: result.reps,
        feedback: result.feedback,
        formScore: result.formScore,
      });
      return result;
    }

    if (this.invalidSince !== null) {
      this.interruptCycle();
      this.invalidSince = null;
    }
    this.samples.push(sample);
    if (this.samples.length > 3) this.samples.shift();
    const filtered: JointSample = {
      ...sample,
      hipAngle: median(this.samples.map(item => item.hipAngle)),
      kneeAngle: median(this.samples.map(item => item.kneeAngle)),
      torsoLean: median(this.samples.map(item => item.torsoLean)),
    };
    if (this.phase !== 'waiting') {
      this.cycleMetrics.lowestKneeAngle = Math.min(
        this.cycleMetrics.lowestKneeAngle,
        filtered.kneeAngle,
      );
      this.cycleMetrics.highestTorsoLean = Math.max(
        this.cycleMetrics.highestTorsoLean,
        filtered.torsoLean,
      );
      this.cycleMetrics.kneesMisaligned ||= filtered.kneeAlignment === true;
    }
    const previousReps = this.reps;
    this.advance(filtered, timestamp);
    const completedCycle = this.reps > previousReps;
    const formScore = completedCycle
      ? estimatedCycleScore(this.cycleMetrics)
      : estimatedScore(filtered, this.phase);
    if (completedCycle) this.cycleMetrics = emptyCycleMetrics();

    const result = {
      phase: this.phase,
      reps: this.reps,
      feedback: getFeedback(filtered, this.phase),
      formScore,
      hipAngle: Math.round(filtered.hipAngle),
      kneeAngle: Math.round(filtered.kneeAngle),
      tracking: true,
    };
    onDiagnostics?.({
      exerciseId: frame.exerciseId,
      coordinateUse: {
        hipAndKneeAngles: 'worldLandmarks',
        torsoLeanAndKneeAlignment: 'normalizedLandmarks',
      },
      landmarkIndices: LANDMARK_INDICES,
      left: getSideDiagnostics(frame, 'left'),
      right: getSideDiagnostics(frame, 'right'),
      reliable: true,
      selectedSide: getSelectedSide(frame),
      phase: result.phase,
      candidatePhase: this.candidate?.phase ?? null,
      candidateFrames: this.candidate?.frames ?? 0,
      candidateElapsedMs: this.candidate ? timestamp - this.candidate.startedAt : 0,
      cycleInterrupted: this.cycleInterrupted,
      reps: result.reps,
      feedback: result.feedback,
      formScore: result.formScore,
    });
    return result;
  }

  private interruptCycle() {
    this.phase = 'waiting';
    this.candidate = null;
    this.samples = [];
    this.cycleInterrupted = true;
    this.lowestKneeAngle = Number.POSITIVE_INFINITY;
    this.cycleMetrics = emptyCycleMetrics();
  }

  private advance(sample: JointSample, timestamp: number) {
    const standing = sample.kneeAngle >= 160 && sample.hipAngle >= 145;
    const deep = sample.kneeAngle <= 105 && sample.hipAngle <= 125;
    let desired: SquatPhase = this.phase;

    if (this.phase === 'waiting') {
      if (standing) desired = 'standing';
    } else if (this.phase === 'standing') {
      if (!standing && (sample.kneeAngle <= 145 || sample.hipAngle <= 135)) desired = 'descending';
    } else if (this.phase === 'descending') {
      if (deep) desired = 'bottom';
      else if (standing) desired = 'standing';
    } else if (this.phase === 'bottom') {
      this.lowestKneeAngle = Math.min(this.lowestKneeAngle, sample.kneeAngle);
      if (sample.kneeAngle >= this.lowestKneeAngle + 15 || standing) desired = 'ascending';
    } else if (this.phase === 'ascending') {
      if (standing) desired = 'standing';
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
    const requiredFrames =
      desired === 'standing' && this.phase === 'waiting' ? 4 : MIN_PHASE_FRAMES;
    const requiredDuration =
      desired === 'standing' && this.phase === 'waiting' ? 220 : MIN_PHASE_DURATION_MS;
    if (
      this.candidate.frames < requiredFrames ||
      timestamp - this.candidate.startedAt < requiredDuration
    )
      return;

    const previous = this.phase;
    this.phase = desired;
    this.candidate = null;
    if (previous === 'descending' && desired === 'bottom') {
      this.lowestKneeAngle = sample.kneeAngle;
      this.cycleInterrupted = false;
    }
    if (desired === 'standing') {
      if (previous === 'ascending' && !this.cycleInterrupted) this.reps += 1;
      if (previous === 'descending') this.cycleMetrics = emptyCycleMetrics();
      this.cycleInterrupted = false;
      this.lowestKneeAngle = Number.POSITIVE_INFINITY;
    }
  }
}

export class SquatRepCompletionGate {
  private submittedSetIds = new Set<string>();

  shouldSubmit(setId: string, reps: number, targetReps: number) {
    if (!setId || !Number.isInteger(reps) || reps < targetReps || targetReps <= 0) return false;
    if (this.submittedSetIds.has(setId)) return false;
    this.submittedSetIds.add(setId);
    return true;
  }

  release(setId: string) {
    this.submittedSetIds.delete(setId);
  }
}
