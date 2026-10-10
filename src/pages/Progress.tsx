import { Activity, Flame, CheckCircle2, Clock, Dumbbell, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { MetricCard } from '@/components/primitives/MetricCard';
import { Badge } from '@/components/primitives/Badge';
import { formatDate, formatDuration } from '@/utils/formatters';
import { workoutService, type WorkoutProgress } from '@/services/workoutService';

export function ProgressPage() {
  const [progress, setProgress] = useState<WorkoutProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    workoutService
      .getProgress()
      .then(result => {
        if (mounted) setProgress(result);
      })
      .catch(requestError => {
        if (mounted) {
          setError(
            requestError instanceof Error ? requestError.message : 'Progress could not be loaded.',
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

  const weeklyProgress = progress?.weeklyProgress ?? [];
  const exerciseProgress = progress?.exerciseProgress ?? [];
  const personalRecords = progress?.personalRecords;
  const maxExerciseSets = Math.max(1, ...exerciseProgress.map(exercise => exercise.totalSets));

  return (
    <PageContainer>
      <PageHeading
        title="My Progress"
        subtitle="Review your completed workout totals, exercise progress, and personal records."
      />

      {/* High-level Progress Metric Cards */}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Workouts"
          value={progress?.totalWorkouts ?? (isLoading ? '…' : '—')}
          unit="workouts"
          change={
            isLoading ? 'Loading…' : progress?.totalWorkouts ? 'Completed' : 'No workouts yet'
          }
          changeType="neutral"
          icon={<Dumbbell className="h-4 w-4" />}
          subtitle="All completed sessions"
        />
        <MetricCard
          label="Total Reps"
          value={progress?.totalReps ?? (isLoading ? '…' : '—')}
          unit="reps"
          change={progress?.totalReps ? 'From completed sets' : 'No reps recorded'}
          changeType="neutral"
          icon={<CheckCircle2 className="h-4 w-4" />}
          subtitle="Completed sets"
        />
        <MetricCard
          label="Total Workout Time"
          value={
            progress ? formatDuration(progress.totalWorkoutTimeSeconds) : isLoading ? '…' : '—'
          }
          change={
            progress?.totalWorkoutTimeSeconds ? 'Across completed sessions' : 'No time recorded'
          }
          changeType="neutral"
          icon={<Clock className="h-4 w-4" />}
          subtitle="Hours, minutes, seconds"
        />
        <MetricCard
          label="Estimated Calories"
          value={progress?.totalEstimatedCalories ?? '—'}
          unit={progress?.totalEstimatedCalories === undefined ? undefined : 'kcal'}
          change={
            progress?.totalEstimatedCalories === undefined ? 'Estimate unavailable' : 'Estimate'
          }
          changeType="neutral"
          icon={<Flame className="h-4 w-4" />}
          subtitle="Based on profile weight and timed sets"
        />
      </div>

      {/* Useful Visual Charts & Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Weekly Weight Lifted Trend Chart */}
        <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
            <div>
              <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                Weekly Total Weight Lifted (kg)
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Total weight volume lifted across all sets each week
              </p>
            </div>
            <Badge variant="cyan">Last 5 Weeks</Badge>
          </div>

          {/* Clean Visual Progress Bars */}
          <div className="space-y-4 pt-3">
            {weeklyProgress.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                Your workout progress will appear here after you complete a session.
              </p>
            )}
            {weeklyProgress.map(point => {
              const maxVol = Math.max(1, ...weeklyProgress.map(week => week.totalVolumeKg));
              const barWidth = Math.round((point.totalVolumeKg / maxVol) * 100);
              return (
                <div key={point.weekStart} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-300">
                      Week of {formatDate(point.weekStart)}
                    </span>
                    <span className="font-semibold text-white">
                      {point.totalVolumeKg.toLocaleString()} kg lifted •{' '}
                      {point.averageFormScore ?? '—'}% Form
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                    <div
                      className="h-full rounded-full bg-brand-cyan transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Muscle Group Training Breakdown */}
        <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
            <div>
              <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                Workout Distribution
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">Completed sets by exercise</p>
            </div>
            {exerciseProgress.length > 0 && <Badge variant="teal">Personal History</Badge>}
          </div>

          <div className="space-y-3.5 pt-2">
            {exerciseProgress.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                Your exercise progress will appear after your first completed workout.
              </p>
            )}
            {exerciseProgress.map(item => (
              <div key={item.exerciseId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">{item.exerciseName}</span>
                  <span className="font-semibold text-brand-cyan">
                    {item.totalSets} sets ·{' '}
                    {item.totalDurationSeconds !== undefined
                      ? formatDuration(item.totalDurationSeconds)
                      : `${item.totalReps} reps`}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                  <div
                    className="h-full rounded-full bg-brand-cyan"
                    style={{ width: `${Math.round((item.totalSets / maxExerciseSets) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Best form {item.bestFormScore === undefined ? '—' : `${item.bestFormScore}%`}
                  {item.estimatedCalories === undefined
                    ? ''
                    : ` · Estimated calories ~${item.estimatedCalories} kcal`}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 rounded-xl border border-brand-teal/20 bg-brand-dark/60 p-3.5 text-xs text-gray-300">
            <span className="block font-display font-bold leading-tight tracking-normal text-white">
              Training Summary
            </span>
            {isLoading
              ? 'Loading your workout data…'
              : `${progress?.totalWorkouts ?? 0} completed workouts · ${progress?.totalReps ?? 0} reps · ${formatDuration(progress?.totalWorkoutTimeSeconds ?? 0)} total`}
          </div>
        </Card>
      </div>

      <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6">
        <div className="flex items-center gap-2 border-b border-brand-teal/20 pb-3">
          <Trophy className="h-4 w-4 text-brand-cyan" />
          <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
            Personal Records
          </h3>
        </div>
        {exerciseProgress.length === 0 ? (
          <p className="text-sm text-gray-400">
            Complete workouts to establish your personal records.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Highest reps / set"
              value={personalRecords?.highestRepsPerSet ?? '—'}
              unit="reps"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MetricCard
              label="Longest plank"
              value={
                personalRecords?.longestPlankSeconds === undefined
                  ? '—'
                  : formatDuration(personalRecords.longestPlankSeconds)
              }
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricCard
              label="Best form score"
              value={personalRecords?.bestFormScore ?? '—'}
              unit="%"
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              label="Highest set weight"
              value={personalRecords?.highestWeightKg ?? '—'}
              unit="kg"
              icon={<Dumbbell className="h-4 w-4" />}
            />
            <MetricCard
              label="Highest set volume"
              value={personalRecords?.highestSetVolumeKg ?? '—'}
              unit="kg"
              icon={<Flame className="h-4 w-4" />}
            />
            <MetricCard
              label="Highest workout volume"
              value={personalRecords?.highestWorkoutVolumeKg ?? '—'}
              unit="kg"
              icon={<Trophy className="h-4 w-4" />}
            />
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
