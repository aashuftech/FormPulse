import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Check,
  Activity,
  Volume2,
  Clock,
  Dumbbell,
  Flame,
  Camera,
  Pause,
} from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { Input } from '@/components/primitives/Input';
import { useWorkout } from '@/hooks/useWorkout';
import { usePoseCamera } from '@/hooks/usePoseCamera';
import { SquatRepCompletionGate, type SquatDetectionResult } from '@/services/squatDetector';
import type { PushUpDetectionResult } from '@/services/pushUpDetector';
import type { LungeDetectionResult } from '@/services/lungeDetector';
import type { JumpingJackDetectionResult } from '@/services/jumpingJackDetector';
import type { PlankDetectionResult } from '@/services/plankDetector';
import { voiceCoach } from '@/services/voiceCoach';
import { formatDuration } from '@/utils/formatters';

export function WorkoutPage() {
  type ExerciseDetectionResult =
    | SquatDetectionResult
    | PushUpDetectionResult
    | LungeDetectionResult
    | JumpingJackDetectionResult
    | PlankDetectionResult;
  const {
    activeSession,
    lastCompletedWorkout,
    isSessionActive,
    startSession,
    completeWorkout,
    completeSet,
    isStarting,
    isUpdatingSet,
    isCompleting,
    error,
  } = useWorkout();
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newReps, setNewReps] = useState('12');
  const [squatView, setSquatView] = useState<ExerciseDetectionResult | null>(null);
  const [squatViewSetId, setSquatViewSetId] = useState<string | null>(null);
  const squatViewRef = useRef<ExerciseDetectionResult | null>(null);
  const squatViewSetIdRef = useRef<string | null>(null);
  const lastSquatViewUpdateRef = useRef(0);
  const squatCompletionGateRef = useRef(new SquatRepCompletionGate());
  const plankCompletionGateRef = useRef(new Set<string>());
  const readyAnnouncementRef = useRef(false);
  const voiceExerciseIdRef = useRef<string | undefined>(undefined);
  const activeSetDurationRef = useRef<{
    setId: string | null;
    activeMilliseconds: number;
    lastFrameAt: number | null;
  }>({ setId: null, activeMilliseconds: 0, lastFrameAt: null });

  useEffect(() => () => voiceCoach.reset(), []);

  // Workout Session Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isSessionActive && isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, isTimerRunning]);

  const handleStart = async () => {
    voiceCoach.reset();
    poseCamera.stopCamera();
    const started = await startSession();
    if (started) {
      setIsTimerRunning(true);
      setElapsedSeconds(0);
      setActiveExerciseIndex(0);
    }
  };

  const handleFinish = async () => {
    voiceCoach.reset();
    readyAnnouncementRef.current = false;
    poseCamera.stopCamera();
    if (await completeWorkout()) {
      setIsTimerRunning(false);
    }
  };

  const handleCameraStart = () => {
    voiceCoach.reset();
    readyAnnouncementRef.current = false;
    voiceCoach.start();
    poseCamera.startCamera();
  };

  const handleCameraStop = () => {
    voiceCoach.reset();
    readyAnnouncementRef.current = false;
    poseCamera.stopCamera();
  };

  const currentExerciseItem = activeSession?.exercises[activeExerciseIndex];
  const nextExerciseIndex =
    activeSession?.exercises.findIndex(item => item.sets.some(set => !set.completed)) ?? -1;
  const currentSetIndex = currentExerciseItem?.sets.findIndex(set => !set.completed) ?? -1;
  const currentSet = currentSetIndex >= 0 ? currentExerciseItem?.sets[currentSetIndex] : undefined;
  useEffect(() => {
    activeSetDurationRef.current = {
      setId: currentSet?.id ?? null,
      activeMilliseconds: 0,
      lastFrameAt: null,
    };
  }, [activeSession?.id, isSessionActive, currentSet?.id]);
  const getMeasuredActiveDurationSeconds = () => {
    const seconds = Math.floor(activeSetDurationRef.current.activeMilliseconds / 1000);
    return seconds > 0 ? seconds : undefined;
  };
  const currentExerciseId = currentExerciseItem?.exerciseId;
  const isCurrentSquat = currentExerciseId === 'ex_squats';
  const isCurrentPushUp = currentExerciseId === 'ex_pushups';
  const isCurrentLunge = currentExerciseId === 'ex_lunges';
  const isCurrentJumpingJack = currentExerciseId === 'ex_jumping_jacks';
  const isCurrentPlank = currentExerciseId === 'ex_plank';
  const currentTargetValue =
    currentExerciseItem?.exercise.trackingType === 'duration'
      ? currentExerciseItem.exercise.targetDurationSeconds
      : currentExerciseItem?.exercise.targetRepsDefault;

  const handleExerciseResult = (result: ExerciseDetectionResult | null) => {
    squatViewRef.current = result;
    const resultSetId = currentSet?.id ?? null;
    squatViewSetIdRef.current = resultSetId;
    if (activeSetDurationRef.current.setId !== resultSetId) {
      activeSetDurationRef.current = {
        setId: resultSetId,
        activeMilliseconds: 0,
        lastFrameAt: null,
      };
    }
    if (!result?.tracking || !resultSetId) {
      activeSetDurationRef.current.lastFrameAt = null;
    } else {
      const frameAt = Date.now();
      const isActivePhase = !['waiting', 'standing', 'top', 'closed', 'invalid'].includes(
        result.phase,
      );
      if (isActivePhase && activeSetDurationRef.current.lastFrameAt !== null) {
        activeSetDurationRef.current.activeMilliseconds += Math.min(
          frameAt - activeSetDurationRef.current.lastFrameAt,
          160,
        );
      }
      activeSetDurationRef.current.lastFrameAt = frameAt;
    }
    setSquatViewSetId(previous => (previous === resultSetId ? previous : resultSetId));
    const now = Date.now();
    if (!result) {
      setSquatView(previous => (previous === null ? previous : null));
      return;
    }
    const isReadyPosition =
      result.tracking &&
      (result.feedback.startsWith('Good position') || ('holding' in result && result.holding));
    if (isReadyPosition) {
      if (!readyAnnouncementRef.current) {
        readyAnnouncementRef.current = true;
        voiceCoach.speak("Good. You're ready.");
      }
    } else {
      voiceCoach.speak(result.feedback);
    }
    setSquatView(previous => {
      const urgent =
        !previous ||
        previous.phase !== result.phase ||
        ('reps' in previous ? previous.reps : null) !== ('reps' in result ? result.reps : null) ||
        ('holding' in previous ? previous.holding : null) !==
          ('holding' in result ? result.holding : null) ||
        ('targetReached' in previous ? previous.targetReached : null) !==
          ('targetReached' in result ? result.targetReached : null) ||
        previous.feedback !== result.feedback ||
        previous.tracking !== result.tracking;
      if (!urgent && now - lastSquatViewUpdateRef.current < 250) return previous;
      lastSquatViewUpdateRef.current = now;
      return result;
    });

    if ('validDurationSeconds' in result) {
      if (
        !result.tracking ||
        !result.holding ||
        !result.targetReached ||
        !isCurrentPlank ||
        !currentExerciseItem ||
        !currentSet?.id ||
        currentSetIndex < 0 ||
        activeExerciseIndex !== nextExerciseIndex ||
        currentExerciseItem.exercise.trackingType !== 'duration' ||
        currentTargetValue === undefined ||
        isUpdatingSet ||
        isCompleting ||
        plankCompletionGateRef.current.has(currentSet.id)
      ) {
        return;
      }
      const setId = currentSet.id;
      plankCompletionGateRef.current.add(setId);
      void completeSet(currentExerciseItem.exerciseId, currentSetIndex, {
        durationSeconds: currentTargetValue,
        ...(getMeasuredActiveDurationSeconds() === undefined
          ? {}
          : { activeDurationSeconds: getMeasuredActiveDurationSeconds() }),
        ...(result.formScore === null ? {} : { formScore: result.formScore }),
      }).then(saved => {
        if (!saved) plankCompletionGateRef.current.delete(setId);
      });
      return;
    }

    if (
      !result.tracking ||
      (!isCurrentSquat && !isCurrentPushUp && !isCurrentLunge && !isCurrentJumpingJack) ||
      !currentExerciseItem ||
      !currentSet?.id ||
      currentSetIndex < 0 ||
      activeExerciseIndex !== nextExerciseIndex ||
      currentExerciseItem?.exercise.trackingType !== 'reps' ||
      currentTargetValue === undefined ||
      isUpdatingSet ||
      isCompleting ||
      !squatCompletionGateRef.current.shouldSubmit(currentSet.id, result.reps, currentTargetValue)
    )
      return;

    const setId = currentSet.id;
    void completeSet(currentExerciseItem.exerciseId, currentSetIndex, {
      reps: currentTargetValue,
      ...(getMeasuredActiveDurationSeconds() === undefined
        ? {}
        : { activeDurationSeconds: getMeasuredActiveDurationSeconds() }),
      ...(result.formScore === null ? {} : { formScore: result.formScore }),
    }).then(saved => {
      if (!saved) squatCompletionGateRef.current.release(setId);
    });
  };

  const poseCamera = usePoseCamera({
    enabled: isSessionActive,
    exerciseId: currentExerciseId ?? 'ex_squats',
    workoutSetId: currentSet?.id,
    targetDurationSeconds: isCurrentPlank ? currentTargetValue : undefined,
    onExerciseResult: handleExerciseResult,
  });

  useEffect(() => {
    if (voiceExerciseIdRef.current === undefined) {
      voiceExerciseIdRef.current = currentExerciseId;
      return;
    }
    if (voiceExerciseIdRef.current === currentExerciseId) return;
    voiceExerciseIdRef.current = currentExerciseId;
    readyAnnouncementRef.current = false;
    voiceCoach.reset();
    if (poseCamera.isRequested) voiceCoach.start();
  }, [currentExerciseId, poseCamera.isRequested]);

  const visibleSquatView = currentSet?.id === squatViewSetId ? squatView : null;
  const visiblePlankView =
    visibleSquatView && 'validDurationSeconds' in visibleSquatView ? visibleSquatView : null;
  const visibleRepView = visibleSquatView && 'reps' in visibleSquatView ? visibleSquatView : null;

  useEffect(() => {
    if (currentTargetValue === undefined) return;
    setNewReps(String(currentTargetValue));
  }, [activeSession?.id, currentExerciseId, currentSetIndex, currentTargetValue]);

  const handleCompleteSet = () => {
    if (!currentExerciseItem || currentSetIndex < 0) return;
    const value = Number(newReps);
    const weight = newWeight.trim() ? Number(newWeight) : undefined;
    const progress =
      currentExerciseItem.exercise.trackingType === 'duration'
        ? { durationSeconds: value, weightKg: weight }
        : {
            reps: value,
            ...(getMeasuredActiveDurationSeconds() === undefined
              ? {}
              : { activeDurationSeconds: getMeasuredActiveDurationSeconds() }),
            weightKg: weight,
            ...(isCurrentSquat &&
            squatViewSetIdRef.current === currentSet?.id &&
            squatViewRef.current?.tracking &&
            squatViewRef.current.formScore !== null
              ? { formScore: squatViewRef.current.formScore }
              : {}),
          };
    void completeSet(currentExerciseItem.exerciseId, currentSetIndex, progress);
  };

  // Calculate total reps completed in session
  const totalRepsCompleted =
    activeSession?.exercises.reduce((total, ex) => {
      return total + ex.sets.filter(s => s.completed).reduce((sum, s) => sum + (s.reps ?? 0), 0);
    }, 0) || 0;

  return (
    <PageContainer maxWidth="2xl">
      <PageHeading
        title="Workout Session"
        subtitle="Track your sets and view pose landmarks with your device camera."
      >
        {!isSessionActive ? (
          <Button
            size="md"
            variant="primary"
            onClick={() => void handleStart()}
            disabled={isStarting}
            leftIcon={<Play className="h-4 w-4 fill-current" />}
          >
            {isStarting ? 'Starting…' : 'Start Workout'}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              leftIcon={
                isTimerRunning ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )
              }
            >
              {isTimerRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => void handleFinish()}
              disabled={isCompleting || isUpdatingSet}
              leftIcon={<Square className="h-3.5 w-3.5 fill-current" />}
            >
              {isCompleting ? 'Completing…' : 'Finish Workout'}
            </Button>
          </div>
        )}
      </PageHeading>

      {!isSessionActive ? (
        /* Empty / Pre-launch State */
        <>
          {error && (
            <p role="alert" className="mb-4 text-center text-sm text-red-400">
              {error}
            </p>
          )}
          {lastCompletedWorkout?.summary && (
            <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-5">
              <div className="border-b border-brand-teal/20 pb-3">
                <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                  Workout Summary
                </h3>
                <p className="mt-1 text-sm text-gray-400">{lastCompletedWorkout.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <SummaryValue
                  label="Total workout duration"
                  value={formatDuration(lastCompletedWorkout.summary.durationSeconds)}
                />
                <SummaryValue
                  label="Exercises completed"
                  value={lastCompletedWorkout.summary.exercisesCompleted}
                />
                <SummaryValue label="Total sets" value={lastCompletedWorkout.summary.totalSets} />
                <SummaryValue label="Total reps" value={lastCompletedWorkout.summary.totalReps} />
                <SummaryValue
                  label="Plank duration"
                  value={formatDuration(lastCompletedWorkout.summary.plankDurationSeconds)}
                />
                <SummaryValue
                  label="Estimated calories"
                  value={
                    lastCompletedWorkout.summary.estimatedCalories === undefined
                      ? 'Unavailable'
                      : `~${lastCompletedWorkout.summary.estimatedCalories} kcal`
                  }
                />
                <SummaryValue
                  label="Average form score"
                  value={
                    lastCompletedWorkout.summary.averageFormScore === undefined
                      ? '—'
                      : `${lastCompletedWorkout.summary.averageFormScore}%`
                  }
                />
                <SummaryValue
                  label="Total volume"
                  value={`${lastCompletedWorkout.summary.totalVolumeKg.toLocaleString()} kg`}
                />
              </div>
              <p className="text-xs text-gray-400">Calorie values are estimates.</p>
            </Card>
          )}
          <Card className="space-y-6 border border-brand-teal/20 bg-brand-dark/30 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-cyan/40 bg-brand-dark text-brand-cyan shadow-sm">
              <Dumbbell className="h-8 w-8" />
            </div>
            <div className="mx-auto max-w-md space-y-2">
              <h3 className="font-display text-2xl font-bold leading-tight tracking-normal text-white">
                Ready to Start Training?
              </h3>
              <p className="text-sm text-gray-300">
                Start your workout to access the live camera preview and pose landmarks while you
                track your sets.
              </p>
            </div>
            <div>
              <Button
                size="lg"
                variant="primary"
                onClick={() => void handleStart()}
                disabled={isStarting}
                leftIcon={<Play className="h-4 w-4 fill-current" />}
              >
                {isStarting ? 'Starting…' : 'Start Workout'}
              </Button>
            </div>
          </Card>
        </>
      ) : (
        /* Active Running View */
        <div className="space-y-6">
          {/* Key Workout Status Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Workout Duration */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Workout Duration</span>
              <div className="mt-1 flex items-center gap-2 font-sans text-2xl font-bold text-white">
                <Clock className="h-5 w-5 text-brand-cyan" />
                {formatDuration(elapsedSeconds)}
              </div>
            </Card>

            {/* Completed Reps or Plank Duration */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">
                {isCurrentPlank ? 'Valid Plank Hold' : 'Completed Reps'}
              </span>
              <div className="mt-1 flex items-center gap-2 font-sans text-2xl font-bold text-white">
                <Check className="h-5 w-5 text-emerald-400" />
                {isCurrentPlank
                  ? `${formatDuration(Math.floor(visiblePlankView?.validDurationSeconds ?? 0))} / ${formatDuration(currentTargetValue ?? 0)}`
                  : `${
                      totalRepsCompleted +
                      (isCurrentSquat || isCurrentPushUp || isCurrentLunge || isCurrentJumpingJack
                        ? (visibleRepView?.reps ?? 0)
                        : 0)
                    } Reps`}
              </div>
            </Card>

            {/* Form Score */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Estimated Form Score</span>
              <div className="mt-1 flex items-center gap-2 font-sans text-2xl font-bold text-brand-cyan">
                <Activity className="h-5 w-5 text-brand-cyan" />
                {(isCurrentSquat ||
                  isCurrentPushUp ||
                  isCurrentLunge ||
                  isCurrentJumpingJack ||
                  isCurrentPlank) &&
                visibleSquatView?.tracking &&
                visibleSquatView.formScore !== null
                  ? `${visibleSquatView.formScore}/100`
                  : '—'}
              </div>
            </Card>

            {/* Estimated Calories */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Estimated calories</span>
              <div className="mt-1 flex items-center gap-2 font-sans text-2xl font-bold text-amber-400">
                <Flame className="h-5 w-5 text-amber-400" />
                {activeSession?.caloriesBurned ? `~${activeSession.caloriesBurned} kcal` : '—'}
              </div>
            </Card>
          </div>

          {/* Main Stage: Camera Preview & Exercise Sets */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Camera View & Live Form Guidance */}
            <div className="space-y-4 lg:col-span-6">
              <Card className="relative border border-brand-teal/30 bg-brand-dark/30 p-5">
                <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-brand-cyan" />
                    <span className="font-display text-sm font-bold leading-tight tracking-normal text-white">
                      Workout Guidance
                    </span>
                  </div>
                  <Badge variant="cyan">{currentExerciseItem ? 'Ready' : 'No Exercise'}</Badge>
                </div>

                {/* Camera Viewport */}
                <div className="relative my-4 flex h-72 flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-teal/30 bg-brand-black/90">
                  {poseCamera.isRequested && (
                    <>
                      <video
                        ref={poseCamera.videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
                        aria-label="Live camera preview"
                      />
                      <canvas
                        ref={poseCamera.canvasRef}
                        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
                        aria-hidden="true"
                      />
                      <div className="absolute left-3 top-3 rounded-md border border-brand-teal/30 bg-brand-black/75 px-2.5 py-1.5 text-xs text-white">
                        {poseCamera.status === 'requesting-camera' &&
                          'Requesting camera permission…'}
                        {poseCamera.status === 'loading-model' && 'Loading pose tracking…'}
                        {poseCamera.status === 'streaming' &&
                          (poseCamera.hasPose
                            ? 'Pose detected'
                            : 'Position your full body in view')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute right-3 top-3 bg-brand-black/75"
                        onClick={handleCameraStop}
                      >
                        Stop Camera
                      </Button>
                    </>
                  )}

                  {!poseCamera.isRequested && (
                    <div className="space-y-3 p-6 text-center">
                      <div className="inline-flex rounded-full border border-brand-cyan/40 bg-brand-dark/80 p-4 text-brand-cyan">
                        <Activity className="h-8 w-8 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                          {currentExerciseItem?.exercise.name ?? 'No exercise selected'}
                        </h4>
                        <p className="mt-1 text-xs font-medium text-gray-300">
                          {poseCamera.error ?? 'Camera is off. Start it to view pose landmarks.'}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={handleCameraStart}
                        >
                          {poseCamera.status === 'error' ? 'Retry Camera' : 'Start Camera'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-4 right-4 flex justify-between rounded-lg border border-brand-teal/20 bg-brand-dark/80 px-3 py-2 text-xs text-gray-300 backdrop-blur-md">
                    <span>Exercise: {currentExerciseItem?.exercise.name ?? 'None selected'}</span>
                    <span className="font-medium text-brand-cyan">
                      {poseCamera.status === 'streaming'
                        ? poseCamera.hasPose
                          ? 'Pose tracking active'
                          : 'Waiting for pose'
                        : 'Pose camera'}
                    </span>
                  </div>
                </div>

                {/* Clear Form Feedback Cues */}
                <div className="space-y-2 rounded-xl border border-brand-teal/25 bg-brand-dark/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-cyan">
                    <Volume2 className="h-4 w-4" /> Live Form Tips
                  </div>
                  <ul className="space-y-1.5 pl-1 text-xs text-gray-200">
                    {currentExerciseItem?.exercise.formTips.map((tip, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                        {tip}
                      </li>
                    )) ?? <li>Select an exercise to see form tips.</li>}
                  </ul>
                  {isCurrentPlank && (
                    <div className="mt-3 border-t border-brand-teal/20 pt-3 text-xs text-gray-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-white">
                          Valid hold:{' '}
                          {formatDuration(Math.floor(visiblePlankView?.validDurationSeconds ?? 0))}{' '}
                          / {formatDuration(currentTargetValue ?? 0)}
                        </span>
                        <span className="text-brand-cyan">
                          Detection:{' '}
                          {!poseCamera.isRequested
                            ? 'Camera off'
                            : poseCamera.status === 'error'
                              ? 'Unavailable'
                              : poseCamera.status !== 'streaming'
                                ? 'Starting'
                                : !visiblePlankView?.tracking
                                  ? 'Move into camera view'
                                  : visiblePlankView.phase === 'invalid'
                                    ? 'Get into plank position'
                                    : visiblePlankView.phase === 'entering'
                                      ? 'Stabilize your position'
                                      : visiblePlankView.holding
                                        ? 'Holding'
                                        : 'Pause and correct your form'}
                        </span>
                      </div>
                      <p role="status" className="mt-1">
                        {poseCamera.error ??
                          visiblePlankView?.feedback ??
                          'Start the camera to time your plank.'}
                      </p>
                      <p className="mt-1 text-gray-400">
                        The coaching score is an estimate, not a medical measurement.
                      </p>
                    </div>
                  )}
                  {!isCurrentPlank &&
                    (isCurrentSquat ||
                      isCurrentPushUp ||
                      isCurrentLunge ||
                      isCurrentJumpingJack) && (
                      <div className="mt-3 border-t border-brand-teal/20 pt-3 text-xs text-gray-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-white">
                            {isCurrentPushUp
                              ? 'Push-Up reps'
                              : isCurrentLunge
                                ? 'Lunge reps'
                                : isCurrentJumpingJack
                                  ? 'Jumping Jack reps'
                                  : 'Squat reps'}
                            : {visibleRepView?.reps ?? 0} / {currentTargetValue ?? '—'}
                          </span>
                          <span className="text-brand-cyan">
                            Detection:{' '}
                            {!poseCamera.isRequested
                              ? 'Camera off'
                              : poseCamera.status === 'error'
                                ? 'Unavailable'
                                : poseCamera.status !== 'streaming'
                                  ? 'Starting'
                                  : !visibleRepView?.tracking
                                    ? 'Move into camera view'
                                    : visibleRepView.phase === 'waiting'
                                      ? isCurrentPushUp
                                        ? 'Get into the top position'
                                        : isCurrentJumpingJack
                                          ? 'Start in the closed position'
                                          : 'Stand fully to begin'
                                      : visibleRepView.phase[0].toUpperCase() +
                                        visibleRepView.phase.slice(1)}
                          </span>
                        </div>
                        <p role="status" className="mt-1">
                          {poseCamera.error ??
                            visibleRepView?.feedback ??
                            (isCurrentJumpingJack
                              ? 'Start the camera to count Jumping Jack reps.'
                              : isCurrentLunge
                                ? 'Start the camera to count lunge reps.'
                                : 'Start the camera to count squat reps.')}
                        </p>
                        <p className="mt-1 text-gray-400">
                          The coaching score is an estimate, not a medical measurement.
                        </p>
                      </div>
                    )}
                </div>
              </Card>
            </div>

            {/* Set Tracker & Routine Control */}
            <div className="space-y-4 lg:col-span-6">
              {/* Exercise Selector Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeSession?.exercises.map((item, idx) => (
                  <button
                    key={item.exerciseId}
                    type="button"
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`whitespace-nowrap rounded-lg border px-3.5 py-2 font-sans text-xs transition-colors ${
                      activeExerciseIndex === idx
                        ? 'border-brand-cyan bg-brand-dark font-semibold text-white shadow-sm'
                        : 'border-brand-teal/20 bg-brand-black/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}. {item.exercise.name}
                  </button>
                ))}
                {activeSession?.exercises.length === 0 && (
                  <p className="py-2 text-xs text-gray-400">No exercises have been added yet.</p>
                )}
              </div>

              {/* Sets Table */}
              <Card className="border border-brand-teal/30 bg-brand-dark/30 p-5">
                <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold leading-tight tracking-normal text-white">
                      {currentExerciseItem?.exercise.name ?? 'Workout Sets'}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Target: {currentExerciseItem?.exercise.targetSetsDefault} sets of{' '}
                      {currentExerciseItem?.exercise.trackingType === 'duration'
                        ? `${currentExerciseItem.exercise.targetDurationSeconds} seconds`
                        : `${currentExerciseItem?.exercise.targetRepsDefault} reps`}
                    </p>
                  </div>
                  <Badge variant="teal">{currentExerciseItem?.exercise.muscleGroup}</Badge>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 border-b border-brand-teal/15 px-2 pb-1.5 text-xs font-medium text-gray-400">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-3">Weight (kg)</span>
                    <span className="col-span-3">
                      {currentExerciseItem?.exercise.trackingType === 'duration'
                        ? 'Duration'
                        : 'Reps'}
                    </span>
                    <span className="col-span-2">Form</span>
                    <span className="col-span-2 text-right">Done</span>
                  </div>

                  {currentExerciseItem?.sets.map((set, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 items-center gap-2 rounded-lg border p-2.5 text-xs ${
                        set.completed
                          ? 'border-brand-teal/40 bg-brand-dark/70 text-gray-300'
                          : 'border-brand-teal/20 bg-brand-dark/20 text-white'
                      }`}
                    >
                      <span className="col-span-2 font-bold text-brand-cyan">
                        Set {set.setNumber}
                      </span>
                      <span className="col-span-3 font-medium">{set.weightKg ?? '—'} kg</span>
                      <span className="col-span-3 font-medium">
                        {currentExerciseItem?.exercise.trackingType === 'duration'
                          ? set.durationSeconds
                            ? `${set.durationSeconds} sec`
                            : '—'
                          : set.reps
                            ? `${set.reps} reps`
                            : '—'}
                        {set.estimatedCalories === undefined ? (
                          <span className="block text-gray-400">
                            Estimate needs profile weight and timed activity
                          </span>
                        ) : (
                          <span className="block text-amber-400">
                            Estimated calories: ~{set.estimatedCalories} kcal
                          </span>
                        )}
                      </span>
                      <span className="col-span-2">
                        {set.completed ? (
                          <Badge variant="cyan" size="sm">
                            {set.accuracyScore ?? '—'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </span>
                      <div className="col-span-2 text-right">
                        {set.completed ? (
                          <span className="inline-flex items-center font-medium text-emerald-400">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : idx === currentSetIndex && activeExerciseIndex === nextExerciseIndex ? (
                          <span className="text-xs text-brand-cyan">Current</span>
                        ) : (
                          <span className="text-xs text-gray-500">Locked</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Record Current Set */}
                <div className="mt-5 grid grid-cols-12 items-end gap-3 border-t border-brand-teal/20 pt-4">
                  <div className="col-span-5">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={newWeight}
                      min={0}
                      max={2000}
                      step={0.5}
                      onChange={e => setNewWeight(e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={newReps}
                      min={1}
                      max={
                        currentExerciseItem?.exercise.trackingType === 'duration'
                          ? currentExerciseItem.exercise.targetDurationSeconds
                          : currentExerciseItem?.exercise.targetRepsDefault
                      }
                      step={1}
                      label={
                        currentExerciseItem?.exercise.trackingType === 'duration'
                          ? 'Seconds'
                          : 'Reps'
                      }
                      onChange={e => setNewReps(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Button
                      size="md"
                      variant="secondary"
                      className="w-full"
                      disabled={
                        !currentExerciseItem ||
                        currentSetIndex < 0 ||
                        activeExerciseIndex !== nextExerciseIndex ||
                        isUpdatingSet ||
                        isCompleting
                      }
                      onClick={handleCompleteSet}
                      leftIcon={<Check className="h-4 w-4" />}
                    >
                      {isUpdatingSet
                        ? 'Saving…'
                        : currentSetIndex < 0
                          ? 'Sets Complete'
                          : 'Complete Set'}
                    </Button>
                  </div>
                </div>
                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-400">
                    {error}
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function SummaryValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="block text-xs text-gray-400">{label}</span>
      <span className="mt-1 block font-semibold text-white">{value}</span>
    </div>
  );
}
