import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, Dumbbell, Flame, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { formatDate, formatNumber } from '@/utils/formatters';
import type { WorkoutSession } from '@/types';
import { workoutService } from '@/services/workoutService';

export function HistoryPage() {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailRequest = useRef(0);

  useEffect(() => {
    let mounted = true;
    workoutService
      .getHistory()
      .then(result => {
        if (!mounted) return;
        setWorkoutHistory(result.workouts);
        setTotalWorkouts(result.total);
      })
      .catch(requestError => {
        if (mounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Workout history could not be loaded.',
          );
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectWorkout = async (session: WorkoutSession) => {
    setSelectedSession(session);
    setError(null);
    const requestId = ++detailRequest.current;
    setIsLoadingDetails(true);
    try {
      const details = await workoutService.getById(session.id);
      if (requestId === detailRequest.current) setSelectedSession(details);
    } catch (requestError) {
      if (requestId === detailRequest.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Workout details could not be loaded.',
        );
      }
    } finally {
      if (requestId === detailRequest.current) setIsLoadingDetails(false);
    }
  };

  return (
    <PageContainer>
      <PageHeading
        title="Workout History"
        subtitle="Review your past workout logs, completed reps, form scores, and calories burned."
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <span className="block text-xs font-medium text-gray-400">Total Workouts</span>
          <div className="mt-1 font-sans text-2xl font-bold text-white">
            {totalWorkouts} Sessions
          </div>
        </div>
        <div className="rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <span className="block text-xs font-medium text-gray-400">Total Weight Lifted</span>
          <div className="mt-1 font-sans text-2xl font-bold text-brand-cyan">— kg</div>
        </div>
        <div className="rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <span className="block text-xs font-medium text-gray-400">Average Form Score</span>
          <div className="mt-1 font-sans text-2xl font-bold text-emerald-400">—</div>
        </div>
        <div className="rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <span className="block text-xs font-medium text-gray-400">Active Habit</span>
          <div className="mt-1 font-sans text-2xl font-bold text-white">—</div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Completed Workout Log List */}
        <div className="space-y-3 lg:col-span-6">
          <SectionTitle>Completed Workouts</SectionTitle>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          {isLoading && <Card className="p-5 text-sm text-gray-400">Loading workout history…</Card>}
          {!isLoading && !error && workoutHistory.length === 0 && (
            <Card className="p-5 text-sm text-gray-400">
              Your completed workouts will appear here.
            </Card>
          )}
          {workoutHistory.map(session => {
            const isSelected = selectedSession?.id === session.id;

            // Total reps in this session
            const sessionReps =
              session.totalReps ??
              session.exercises.reduce(
                (acc, e) => acc + e.sets.reduce((sAcc, s) => sAcc + (s.reps ?? 0), 0),
                0,
              );

            return (
              <div
                key={session.id}
                onClick={() => void selectWorkout(session)}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  isSelected
                    ? 'border-brand-cyan bg-brand-dark/60 shadow-card'
                    : 'border-brand-teal/25 bg-brand-dark/20 hover:border-brand-cyan/40 hover:bg-brand-dark/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5 text-brand-cyan" />
                      {formatDate(session.startTime)}
                    </span>
                    <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                      {session.title}
                    </h3>
                  </div>
                  <Badge variant="cyan">
                    {session.averageFormScore === undefined ? '—' : `${session.averageFormScore}%`}{' '}
                    Form Score
                  </Badge>
                </div>

                {/* Workout attributes row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-brand-teal/15 pt-3 text-xs text-gray-300">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-cyan" /> {session.durationMinutes} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {sessionReps} reps
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5 text-brand-cyan" />{' '}
                    {formatNumber(session.totalVolumeKg)} kg
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Flame className="h-3.5 w-3.5" />{' '}
                    {session.caloriesBurned ? `~${session.caloriesBurned} kcal` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Workout Details */}
        <div className="lg:col-span-6">
          <SectionTitle>Workout Details & Sets</SectionTitle>

          {selectedSession ? (
            <Card className="mt-3 space-y-5 border border-brand-teal/30 bg-brand-dark/30 p-5 sm:p-6">
              <div className="border-b border-brand-teal/20 pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan">
                    {selectedSession.averageFormScore === undefined
                      ? '—'
                      : `${selectedSession.averageFormScore}%`}{' '}
                    Average Form
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {formatDate(selectedSession.startTime)}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold leading-tight tracking-normal text-white">
                  {selectedSession.title}
                </h3>
                <p className="mt-1 text-sm text-gray-300">{selectedSession.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-brand-teal/15 pt-3 text-center text-xs">
                  <div>
                    <span className="block text-gray-400">Duration</span>
                    <span className="mt-0.5 block font-semibold text-white">
                      {selectedSession.durationMinutes} mins
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Total Weight</span>
                    <span className="mt-0.5 block font-semibold text-white">
                      {selectedSession.totalVolumeKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Estimated calories</span>
                    <span className="mt-0.5 block font-semibold text-amber-400">
                      {selectedSession.caloriesBurned
                        ? `~${selectedSession.caloriesBurned} kcal (estimate)`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exercises & Sets Performed */}
              <div className="space-y-4">
                <h4 className="font-display text-sm font-bold leading-tight tracking-normal text-white">
                  Exercises Completed
                </h4>

                {isLoadingDetails ? (
                  <p className="text-sm text-gray-400">Loading workout details…</p>
                ) : (
                  selectedSession.exercises.map((item, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-xl border border-brand-teal/20 bg-brand-black/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-sm font-bold text-white">
                          {item.exercise.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.sets.length} Sets completed
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {item.sets.map((set, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between rounded-lg bg-brand-dark/50 px-3 py-1.5 text-xs text-gray-300"
                          >
                            <span>
                              Set {set.setNumber}:{' '}
                              {item.exercise.trackingType === 'duration'
                                ? `${set.durationSeconds ?? '—'} seconds`
                                : `${set.reps ?? '—'} reps`}
                              {set.weightKg === undefined ? '' : ` @ ${set.weightKg} kg`}
                              {set.estimatedCalories === undefined
                                ? ' · Estimate needs profile weight and timed activity'
                                : ` · Estimated calories: ~${set.estimatedCalories} kcal`}
                            </span>
                            <span className="font-semibold text-brand-cyan">
                              {set.accuracyScore === undefined ? '—' : `${set.accuracyScore}%`} Form
                              Accuracy
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : (
            <Card className="mt-3 py-12 text-center text-sm text-gray-400">
              Select a workout from the list to view detailed sets and exercise notes.
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
