export const SUPPORTED_POSE_EXERCISES = [
  'ex_squats',
  'ex_pushups',
  'ex_lunges',
  'ex_jumping_jacks',
  'ex_plank',
] as const;

export type SupportedPoseExercise = (typeof SUPPORTED_POSE_EXERCISES)[number];

export interface PoseLandmark {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface PoseWorldLandmark {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface PoseFrame {
  exerciseId: SupportedPoseExercise;
  timestampMs: number;
  landmarks: PoseLandmark[];
  worldLandmarks: PoseWorldLandmark[];
}

interface RawLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export function isSupportedPoseExercise(value: string): value is SupportedPoseExercise {
  return SUPPORTED_POSE_EXERCISES.some(exerciseId => exerciseId === value);
}

function copyLandmarks(points: RawLandmark[]): PoseLandmark[] {
  return points.map((point, index) => ({
    index,
    x: point.x,
    y: point.y,
    z: point.z,
    visibility: point.visibility,
    presence: point.presence,
  }));
}

export function createPoseFrame(
  exerciseId: SupportedPoseExercise,
  timestampMs: number,
  landmarks: RawLandmark[],
  worldLandmarks: RawLandmark[],
): PoseFrame {
  return {
    exerciseId,
    timestampMs,
    landmarks: copyLandmarks(landmarks),
    worldLandmarks: copyLandmarks(worldLandmarks),
  };
}

const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  [29, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
  [30, 32],
];

export function drawPoseOverlay(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement | null,
  frame: PoseFrame,
) {
  if (!canvas || !video) return;
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.round(bounds.width * pixelRatio);
  const height = Math.round(bounds.height * pixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  if (frame.landmarks.length === 0 || video.videoWidth === 0 || video.videoHeight === 0) return;

  const scale = Math.max(bounds.width / video.videoWidth, bounds.height / video.videoHeight);
  const drawnWidth = video.videoWidth * scale;
  const drawnHeight = video.videoHeight * scale;
  const offsetX = (bounds.width - drawnWidth) / 2;
  const offsetY = (bounds.height - drawnHeight) / 2;
  const point = (index: number) => frame.landmarks[index];

  context.lineWidth = 3;
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(55, 188, 207, 0.9)';
  for (const [fromIndex, toIndex] of POSE_CONNECTIONS) {
    const from = point(fromIndex);
    const to = point(toIndex);
    if (!from || !to || (from.visibility ?? 1) < 0.35 || (to.visibility ?? 1) < 0.35) continue;
    context.beginPath();
    context.moveTo(offsetX + from.x * drawnWidth, offsetY + from.y * drawnHeight);
    context.lineTo(offsetX + to.x * drawnWidth, offsetY + to.y * drawnHeight);
    context.stroke();
  }

  context.fillStyle = '#e7fbff';
  for (const landmark of frame.landmarks) {
    if ((landmark.visibility ?? 1) < 0.35) continue;
    context.beginPath();
    context.arc(
      offsetX + landmark.x * drawnWidth,
      offsetY + landmark.y * drawnHeight,
      4,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}
