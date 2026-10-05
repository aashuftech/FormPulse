import { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Check,
  Plus,
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
import { formatDuration } from '@/utils/formatters';

export function WorkoutPage() {
  const { activeSession, isSessionActive, startSession, endSession, addSet, completeSet } =
    useWorkout();
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [newWeight, setNewWeight] = useState('100');
  const [newReps, setNewReps] = useState('8');

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

  const handleStart = () => {
    startSession('Leg Day & Core Strength');
    setIsTimerRunning(true);
    setElapsedSeconds(0);
  };

  const handleFinish = () => {
    setIsTimerRunning(false);
    endSession();
  };

  const currentExerciseItem = activeSession?.exercises[activeExerciseIndex];

  // Calculate total reps completed in session
  const totalRepsCompleted =
    activeSession?.exercises.reduce((total, ex) => {
      return total + ex.sets.filter(s => s.completed).reduce((sum, s) => sum + s.reps, 0);
    }, 0) || 0;

  // Estimated calories burned based on elapsed time and volume
  const estimatedCalories = Math.round((elapsedSeconds / 60) * 8.5) + totalRepsCompleted * 2;

  return (
    <PageContainer maxWidth="2xl">
      <PageHeading
        title="Workout Session"
        subtitle="Follow real-time form guidance, count your reps, and track your weights."
      >
        {!isSessionActive ? (
          <Button
            size="md"
            variant="primary"
            onClick={handleStart}
            leftIcon={<Play className="h-4 w-4 fill-current" />}
          >
            Start Workout
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
              onClick={handleFinish}
              leftIcon={<Square className="h-3.5 w-3.5 fill-current" />}
            >
              Finish Workout
            </Button>
          </div>
        )}
      </PageHeading>

      {!isSessionActive ? (
        /* Empty / Pre-launch State */
        <Card className="space-y-6 border border-brand-teal/20 bg-brand-dark/30 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-cyan/40 bg-brand-dark text-brand-cyan shadow-sm">
            <Dumbbell className="h-8 w-8" />
          </div>
          <div className="mx-auto max-w-md space-y-2">
            <h3 className="font-display text-2xl font-bold text-white">Ready to Start Training?</h3>
            <p className="text-sm text-gray-300">
              Turn on your camera to receive live form feedback, automatic rep counts, and workout
              stats.
            </p>
          </div>
          <div>
            <Button
              size="lg"
              variant="primary"
              onClick={handleStart}
              leftIcon={<Play className="h-4 w-4 fill-current" />}
            >
              Start Leg Day & Core
            </Button>
          </div>
        </Card>
      ) : (
        /* Active Running View */
        <div className="space-y-6">
          {/* Key Workout Status Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Workout Duration */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Workout Duration</span>
              <div className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-white">
                <Clock className="h-5 w-5 text-brand-cyan" />
                {formatDuration(elapsedSeconds)}
              </div>
            </Card>

            {/* Reps Completed */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Completed Reps</span>
              <div className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-white">
                <Check className="h-5 w-5 text-emerald-400" />
                {totalRepsCompleted} Reps
              </div>
            </Card>

            {/* Form Score */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Live Form Score</span>
              <div className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-brand-cyan">
                <Activity className="h-5 w-5 text-brand-cyan" />
                96%
              </div>
            </Card>

            {/* Estimated Calories */}
            <Card className="border-brand-teal/20 bg-brand-dark/40 p-4">
              <span className="block text-xs font-medium text-gray-400">Estimated Calories</span>
              <div className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-amber-400">
                <Flame className="h-5 w-5 text-amber-400" />
                {estimatedCalories} kcal
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
                    <span className="font-display text-sm font-semibold text-white">
                      Camera Guidance & AI Analysis
                    </span>
                  </div>
                  <Badge variant="cyan">Camera Active</Badge>
                </div>

                {/* Camera Viewport Placeholder */}
                <div className="relative my-4 flex h-72 flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-teal/30 bg-brand-black/90">
                  <div className="space-y-3 p-6 text-center">
                    <div className="inline-flex rounded-full border border-brand-cyan/40 bg-brand-dark/80 p-4 text-brand-cyan">
                      <Activity className="h-8 w-8 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-bold text-white">
                        {currentExerciseItem?.exercise.name}
                      </h4>
                      <p className="mt-1 text-xs font-medium text-emerald-400">
                        Form Status: Excellent — Knees properly aligned
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex justify-between rounded-lg border border-brand-teal/20 bg-brand-dark/80 px-3 py-2 text-xs text-gray-300 backdrop-blur-md">
                    <span>Exercise: {currentExerciseItem?.exercise.name}</span>
                    <span className="font-medium text-brand-cyan">Rep #3 Detected</span>
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
                    ))}
                  </ul>
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
              </div>

              {/* Sets Table */}
              <Card className="border border-brand-teal/30 bg-brand-dark/30 p-5">
                <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">
                      {currentExerciseItem?.exercise.name} Sets
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Target: {currentExerciseItem?.exercise.targetSetsDefault} sets of{' '}
                      {currentExerciseItem?.exercise.targetRepsDefault} reps
                    </p>
                  </div>
                  <Badge variant="teal">{currentExerciseItem?.exercise.muscleGroup}</Badge>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 border-b border-brand-teal/15 px-2 pb-1.5 text-xs font-medium text-gray-400">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-3">Weight (kg)</span>
                    <span className="col-span-3">Reps</span>
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
                      <span className="col-span-3 font-medium">{set.weightKg} kg</span>
                      <span className="col-span-3 font-medium">{set.reps} reps</span>
                      <span className="col-span-2">
                        {set.completed ? (
                          <Badge variant="cyan" size="sm">
                            {set.accuracyScore || 95}%
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
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => completeSet(currentExerciseItem.exerciseId, idx, 96)}
                            className="h-7 px-2.5 text-xs"
                          >
                            Check
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Set */}
                <div className="mt-5 grid grid-cols-12 items-end gap-3 border-t border-brand-teal/20 pt-4">
                  <div className="col-span-5">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={newWeight}
                      onChange={e => setNewWeight(e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      label="Reps"
                      type="number"
                      value={newReps}
                      onChange={e => setNewReps(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Button
                      size="md"
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        if (currentExerciseItem) {
                          addSet(currentExerciseItem.exerciseId, {
                            weightKg: Number(newWeight) || 0,
                            reps: Number(newReps) || 0,
                            completed: false,
                          });
                        }
                      }}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Set
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
