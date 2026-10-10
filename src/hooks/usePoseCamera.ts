import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  createPoseFrame,
  drawPoseOverlay,
  isSupportedPoseExercise,
  type PoseFrame,
} from '@/services/poseProcessing';
import { SquatDetector, type SquatDetectionResult } from '@/services/squatDetector';
import { PushUpDetector, type PushUpDetectionResult } from '@/services/pushUpDetector';
import { LungeDetector, type LungeDetectionResult } from '@/services/lungeDetector';
import {
  JumpingJackDetector,
  type JumpingJackDetectionResult,
} from '@/services/jumpingJackDetector';
import { PlankDetector, type PlankDetectionResult } from '@/services/plankDetector';

const POSE_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const VISION_WASM_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MIN_FRAME_INTERVAL_MS = 80;

export type PoseCameraStatus =
  'idle' | 'requesting-camera' | 'loading-model' | 'streaming' | 'error';

function describePoseError(error: unknown) {
  const value =
    typeof error === 'object' && error !== null
      ? (error as {
          constructor?: { name?: string };
          name?: string;
          message?: string;
          stack?: string;
        })
      : null;
  return {
    constructorName: value?.constructor?.name ?? typeof error,
    name: value?.name ?? 'UnknownError',
    message: value?.message ?? String(error),
    stack: value?.stack,
  };
}

function cameraErrorMessage(error: unknown) {
  if (!window.isSecureContext) return 'Camera access requires HTTPS or localhost.';
  if (!(error instanceof DOMException)) {
    if (error instanceof Error && error.message.includes('unavailable in this browser')) {
      return 'Camera access is unavailable in this browser.';
    }
    return 'Camera access could not be started.';
  }
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Camera permission was denied. Allow camera access in your browser settings and retry.';
  }
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No camera was found on this device.';
  }
  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'The camera is unavailable or being used by another application.';
  }
  return 'Camera access could not be started.';
}

export function usePoseCamera({
  enabled,
  exerciseId,
  workoutSetId,
  targetDurationSeconds,
  onExerciseResult,
}: {
  enabled: boolean;
  exerciseId: string;
  workoutSetId?: string;
  targetDurationSeconds?: number;
  onExerciseResult?: (
    result:
      | SquatDetectionResult
      | PushUpDetectionResult
      | LungeDetectionResult
      | JumpingJackDetectionResult
      | PlankDetectionResult
      | null,
  ) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseResultRef = useRef<PoseFrame | null>(null);
  const exerciseIdRef = useRef(exerciseId);
  const workoutSetIdRef = useRef(workoutSetId);
  const targetDurationSecondsRef = useRef(targetDurationSeconds);
  const onExerciseResultRef = useRef(onExerciseResult);
  const cleanupRef = useRef<(notifyResult?: boolean) => void>(() => undefined);
  const hasPoseRef = useRef(false);
  const [isRequested, setIsRequested] = useState(false);
  const [status, setStatus] = useState<PoseCameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasPose, setHasPose] = useState(false);

  exerciseIdRef.current = exerciseId;
  workoutSetIdRef.current = workoutSetId;
  targetDurationSecondsRef.current = targetDurationSeconds;
  onExerciseResultRef.current = onExerciseResult;

  const startCamera = () => {
    if (!enabled) return;
    setError(null);
    setHasPose(false);
    hasPoseRef.current = false;
    setIsRequested(true);
  };

  const stopCamera = () => {
    cleanupRef.current(true);
    setIsRequested(false);
    setStatus('idle');
    setError(null);
    setHasPose(false);
    hasPoseRef.current = false;
  };

  useEffect(() => {
    if (!enabled || !isRequested) return;

    let disposed = false;
    let stream: MediaStream | null = null;
    let poseLandmarker: PoseLandmarker | null = null;
    const squatDetector = new SquatDetector();
    const pushUpDetector = new PushUpDetector();
    const lungeDetector = new LungeDetector();
    const jumpingJackDetector = new JumpingJackDetector();
    const plankDetector = new PlankDetector();
    let activeWorkoutSetId: string | undefined;
    let activePushUpSetId: string | undefined;
    let activeLungeSetId: string | undefined;
    let activeJumpingJackSetId: string | undefined;
    let activePlankSetId: string | undefined;
    let animationFrame = 0;
    let lastVideoTime = -1;
    let lastProcessTime = 0;
    let lastTimestamp = 0;
    let cleaned = false;
    let startupStage = 'camera access';

    const cleanup = (notifyResult = false) => {
      if (cleaned) return;
      cleaned = true;
      disposed = true;
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
      poseLandmarker?.close();
      poseLandmarker = null;
      squatDetector.reset();
      pushUpDetector.reset();
      lungeDetector.reset();
      jumpingJackDetector.reset();
      plankDetector.reset();
      activeWorkoutSetId = undefined;
      activePushUpSetId = undefined;
      activeLungeSetId = undefined;
      activeJumpingJackSetId = undefined;
      activePlankSetId = undefined;
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.srcObject = null;
      }
      poseResultRef.current = null;
      if (notifyResult) onExerciseResultRef.current?.(null);
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    };
    cleanupRef.current = cleanup;

    const fail = (message: string) => {
      if (disposed) return;
      cleanup(true);
      setError(message);
      setStatus('error');
      setIsRequested(false);
      setHasPose(false);
      hasPoseRef.current = false;
    };

    const processFrame = () => {
      if (disposed) return;
      const video = videoRef.current;
      const now = performance.now();
      if (
        poseLandmarker &&
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== lastVideoTime &&
        now - lastProcessTime >= MIN_FRAME_INTERVAL_MS
      ) {
        lastVideoTime = video.currentTime;
        lastProcessTime = now;
        lastTimestamp = Math.max(now, lastTimestamp + 1);
        const timestampMs = lastTimestamp;
        const currentExercise = exerciseIdRef.current;
        if (isSupportedPoseExercise(currentExercise)) {
          try {
            const detection = poseLandmarker.detectForVideo(video, timestampMs);
            const pose = createPoseFrame(
              currentExercise,
              timestampMs,
              detection.landmarks[0] ?? [],
              detection.worldLandmarks[0] ?? [],
            );
            let squat: SquatDetectionResult | null = null;
            let pushUp: PushUpDetectionResult | null = null;
            let lunge: LungeDetectionResult | null = null;
            let jumpingJack: JumpingJackDetectionResult | null = null;
            let plank: PlankDetectionResult | null = null;
            if (currentExercise === 'ex_squats') {
              const currentWorkoutSetId = workoutSetIdRef.current;
              if (activeWorkoutSetId !== currentWorkoutSetId) {
                squatDetector.reset();
                activeWorkoutSetId = currentWorkoutSetId;
              }
              squat = squatDetector.process(pose, diagnostics => {
                if (import.meta.env.DEV) {
                  console.debug('[FormPulse squat diagnostic] live detector frame', {
                    workoutSetId: currentWorkoutSetId,
                    timestampMs: pose.timestampMs,
                    normalizedLandmarkCount: pose.landmarks.length,
                    worldLandmarkCount: pose.worldLandmarks.length,
                    ...diagnostics,
                  });
                }
              });
              pushUpDetector.reset();
              activePushUpSetId = undefined;
              lungeDetector.reset();
              activeLungeSetId = undefined;
              jumpingJackDetector.reset();
              activeJumpingJackSetId = undefined;
              plankDetector.reset();
              activePlankSetId = undefined;
            } else if (currentExercise === 'ex_pushups') {
              const currentWorkoutSetId = workoutSetIdRef.current;
              if (activePushUpSetId !== currentWorkoutSetId) {
                pushUpDetector.reset();
                activePushUpSetId = currentWorkoutSetId;
              }
              pushUp = pushUpDetector.process(pose, diagnostics => {
                if (import.meta.env.DEV) {
                  console.debug('[FormPulse push-up diagnostic] live detector frame', {
                    workoutSetId: currentWorkoutSetId,
                    timestampMs: pose.timestampMs,
                    normalizedLandmarkCount: pose.landmarks.length,
                    worldLandmarkCount: pose.worldLandmarks.length,
                    ...diagnostics,
                  });
                }
              });
              squatDetector.reset();
              activeWorkoutSetId = undefined;
              lungeDetector.reset();
              activeLungeSetId = undefined;
              jumpingJackDetector.reset();
              activeJumpingJackSetId = undefined;
              plankDetector.reset();
              activePlankSetId = undefined;
            } else if (currentExercise === 'ex_lunges') {
              const currentWorkoutSetId = workoutSetIdRef.current;
              if (activeLungeSetId !== currentWorkoutSetId) {
                lungeDetector.reset();
                activeLungeSetId = currentWorkoutSetId;
              }
              lunge = lungeDetector.process(pose, diagnostics => {
                if (import.meta.env.DEV) {
                  console.debug('[FormPulse lunge diagnostic] live detector frame', {
                    workoutSetId: currentWorkoutSetId,
                    timestampMs: pose.timestampMs,
                    normalizedLandmarkCount: pose.landmarks.length,
                    worldLandmarkCount: pose.worldLandmarks.length,
                    ...diagnostics,
                  });
                }
              });
              squatDetector.reset();
              activeWorkoutSetId = undefined;
              pushUpDetector.reset();
              activePushUpSetId = undefined;
              jumpingJackDetector.reset();
              activeJumpingJackSetId = undefined;
              plankDetector.reset();
              activePlankSetId = undefined;
            } else if (currentExercise === 'ex_jumping_jacks') {
              const currentWorkoutSetId = workoutSetIdRef.current;
              if (activeJumpingJackSetId !== currentWorkoutSetId) {
                jumpingJackDetector.reset();
                activeJumpingJackSetId = currentWorkoutSetId;
              }
              jumpingJack = jumpingJackDetector.process(pose, diagnostics => {
                if (import.meta.env.DEV) {
                  console.debug('[FormPulse jumping-jack diagnostic] live detector frame', {
                    workoutSetId: currentWorkoutSetId,
                    timestampMs: pose.timestampMs,
                    normalizedLandmarkCount: pose.landmarks.length,
                    worldLandmarkCount: pose.worldLandmarks.length,
                    ...diagnostics,
                  });
                }
              });
              squatDetector.reset();
              activeWorkoutSetId = undefined;
              pushUpDetector.reset();
              activePushUpSetId = undefined;
              lungeDetector.reset();
              activeLungeSetId = undefined;
              plankDetector.reset();
              activePlankSetId = undefined;
            } else if (currentExercise === 'ex_plank') {
              const currentWorkoutSetId = workoutSetIdRef.current;
              if (activePlankSetId !== currentWorkoutSetId) {
                plankDetector.reset();
                activePlankSetId = currentWorkoutSetId;
              }
              plank = plankDetector.process(pose, targetDurationSecondsRef.current, diagnostics => {
                if (import.meta.env.DEV) {
                  console.debug('[FormPulse plank diagnostic] live detector frame', {
                    workoutSetId: currentWorkoutSetId,
                    timestampMs: pose.timestampMs,
                    normalizedLandmarkCount: pose.landmarks.length,
                    worldLandmarkCount: pose.worldLandmarks.length,
                    ...diagnostics,
                  });
                }
              });
              squatDetector.reset();
              activeWorkoutSetId = undefined;
              pushUpDetector.reset();
              activePushUpSetId = undefined;
              lungeDetector.reset();
              activeLungeSetId = undefined;
              jumpingJackDetector.reset();
              activeJumpingJackSetId = undefined;
            } else {
              squatDetector.reset();
              activeWorkoutSetId = undefined;
              pushUpDetector.reset();
              activePushUpSetId = undefined;
              lungeDetector.reset();
              activeLungeSetId = undefined;
              jumpingJackDetector.reset();
              activeJumpingJackSetId = undefined;
              plankDetector.reset();
              activePlankSetId = undefined;
            }

            poseResultRef.current = pose;
            drawPoseOverlay(canvasRef.current, video, pose);
            onExerciseResultRef.current?.(
              currentExercise === 'ex_squats'
                ? squat
                : currentExercise === 'ex_pushups'
                  ? pushUp
                  : currentExercise === 'ex_lunges'
                    ? lunge
                    : currentExercise === 'ex_jumping_jacks'
                      ? jumpingJack
                      : currentExercise === 'ex_plank'
                        ? plank
                        : null,
            );
            const detected = pose.landmarks.length > 0;
            if (hasPoseRef.current !== detected) {
              hasPoseRef.current = detected;
              setHasPose(detected);
            }
          } catch (error) {
            const details = describePoseError(error);
            if (import.meta.env.DEV) {
              console.error('[FormPulse pose diagnostic] frame inference failed', {
                stage: 'PoseLandmarker.detectForVideo',
                ...details,
              });
            }
            fail('Pose tracking could not continue. Stop and retry the camera.');
          }
        }
      }
      if (!disposed) animationFrame = requestAnimationFrame(processFrame);
    };

    const initialize = async () => {
      setStatus('requesting-camera');
      startupStage = 'camera access';
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is unavailable in this browser.');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (disposed) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) throw new Error('The camera preview is unavailable.');
      startupStage = 'video playback';
      video.srcObject = stream;
      await video.play();
      if (disposed) return;
      setStatus('loading-model');

      startupStage = 'FilesetResolver.forVisionTasks';
      if (import.meta.env.DEV) {
        console.info('[FormPulse pose diagnostic] resolving MediaPipe vision WASM fileset', {
          wasmBasePath: VISION_WASM_BASE_PATH,
        });
      }
      const vision = await FilesetResolver.forVisionTasks(VISION_WASM_BASE_PATH);
      if (disposed) return;
      if (import.meta.env.DEV) {
        console.info('[FormPulse pose diagnostic] MediaPipe vision WASM fileset resolved');
      }

      startupStage = 'PoseLandmarker.createFromOptions';
      if (import.meta.env.DEV) {
        console.info('[FormPulse pose diagnostic] loading pose model', {
          modelAssetPath: POSE_MODEL_PATH,
        });
      }
      const initializedLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_PATH },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });
      if (disposed) {
        initializedLandmarker.close();
        return;
      }
      poseLandmarker = initializedLandmarker;
      if (import.meta.env.DEV) {
        console.info(
          '[FormPulse pose diagnostic] PoseLandmarker initialized; WASM/runtime and model loading succeeded',
        );
      }
      setStatus('streaming');
      animationFrame = requestAnimationFrame(processFrame);
    };

    void initialize().catch(error => {
      const details = describePoseError(error);
      if (import.meta.env.DEV) {
        console.error('[FormPulse pose diagnostic] startup exception', {
          stage: startupStage,
          ...details,
        });
      }
      const message =
        startupStage === 'camera access' || startupStage === 'video playback'
          ? cameraErrorMessage(error)
          : 'MediaPipe pose initialization failed. Please retry the camera.';
      fail(message);
    });
    return cleanup;
  }, [enabled, isRequested]);

  return {
    videoRef,
    canvasRef,
    poseResultRef,
    isRequested,
    status,
    error,
    hasPose,
    startCamera,
    stopCamera,
  };
}
