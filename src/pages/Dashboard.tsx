import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Activity, Flame, Dumbbell, Clock, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { MetricCard } from '@/components/primitives/MetricCard';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useWorkout } from '@/hooks/useWorkout';
import { ROUTES } from '@/lib/constants';
import { workoutService, type WorkoutProgress } from '@/services/workoutService';
import type { WorkoutSession } from '@/types';
import { formatDate, formatDuration } from '@/utils/formatters';

function getCurrentWeekStart() {
  const today = new Date();
  const weekStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  return weekStart.toISOString().slice(0, 10);
}

export function DashboardPage() {
  const { user } = useAuth();
  const { startSession } = useWorkout();
  const [progress, setProgress] = useState<WorkoutProgress | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([workoutService.getProgress(), workoutService.getHistory(1, 3)])
      .then(([workoutProgress, history]) => {
        if (!mounted) return;
        setProgress(workoutProgress);
        setRecentWorkouts(history.workouts);
      })
      .catch(error => {
        if (mounted) {
          setLoadError(
            error instanceof Error ? error.message : 'Workout data could not be loaded.',
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

  const currentWeek = progress?.weeklyProgress.find(
    week => week.weekStart === getCurrentWeekStart(),
  );
  const completedSets = progress?.exerciseProgress.reduce((sum, item) => sum + item.totalSets, 0);
  const weeklyWorkouts = progress ? (currentWeek?.workoutCount ?? 0) : undefined;
  const weeklyFormScore = currentWeek?.averageFormScore;
  const hasWorkouts = (progress?.totalWorkouts ?? 0) > 0;

  return (
    <PageContainer>
      {/* Top Banner / Heading */}
      <PageHeading
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Athlete'}`}
        subtitle="Here is your workout schedule, recent activity, and weekly progress."
      >
        <Link to={ROUTES.WORKOUT}>
          <Button
            size="md"
            variant="primary"
            onClick={() => startSession()}
            leftIcon={<Play className="h-4 w-4 fill-current" />}
          >
            Start Workout
          </Button>
        </Link>
      </PageHeading>

      {loadError && (
        <p role="alert" className="text-sm text-red-400">
          {loadError}
        </p>
      )}

      {/* Hero: What to do now & Today's Workout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Next Recommended Action */}
        <Card className="flex flex-col justify-between border border-brand-teal/30 bg-brand-dark/30 p-6 lg:col-span-7">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">{hasWorkouts ? 'Your Activity' : 'Getting Started'}</Badge>
              <span className="text-xs text-gray-400">Choose a workout to begin</span>
            </div>

            <h2 className="font-display text-2xl font-bold leading-tight tracking-normal text-white">
              {hasWorkouts
                ? 'Keep building your progress'
                : loadError
                  ? 'Your workout activity is unavailable'
                  : 'Ready for your first workout?'}
            </h2>

            <p className="text-sm leading-relaxed text-gray-300">
              {hasWorkouts
                ? `${progress?.totalWorkouts} completed workouts are in your history.`
                : loadError
                  ? 'Workout history and progress could not be loaded.'
                  : 'Your workout history and progress will appear here after you complete a workout.'}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Exercises</span>
                <span className="block font-sans text-base font-bold text-white">
                  {isLoading ? '…' : `${progress?.exerciseProgress.length ?? '—'} Movements`}
                </span>
              </div>
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Total Sets</span>
                <span className="block font-sans text-base font-bold text-white">
                  {isLoading ? '…' : `${completedSets ?? '—'} Sets`}
                </span>
              </div>
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Form Focus</span>
                <span className="block font-sans text-base font-bold text-brand-cyan">
                  {progress?.personalRecords.bestFormScore === undefined
                    ? '—'
                    : `${progress.personalRecords.bestFormScore}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-brand-teal/20 pt-6">
            <Link to={ROUTES.WORKOUT}>
              <Button
                variant="primary"
                size="md"
                onClick={() => startSession()}
                leftIcon={<Play className="h-4 w-4 fill-current" />}
              >
                Start Workout
              </Button>
            </Link>
            <Link to={ROUTES.EXERCISES}>
              <Button variant="ghost" size="md">
                Preview Exercises
              </Button>
            </Link>
          </div>
        </Card>

        {/* Weekly Progress Overview */}
        <Card className="flex flex-col justify-between border border-brand-teal/25 bg-brand-dark/30 p-6 lg:col-span-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
              <span className="font-display text-base font-bold leading-tight tracking-normal text-white">
                Weekly Activity
              </span>
              <Badge variant="teal">
                {isLoading ? 'Loading…' : `${weeklyWorkouts ?? '—'} Workouts`}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300">Best Form Score This Week</span>
                <span className="font-bold text-brand-cyan">
                  {weeklyFormScore === undefined ? '—' : `${weeklyFormScore}%`}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                <div
                  className="h-full rounded-full bg-brand-cyan"
                  style={{ width: `${weeklyFormScore ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {weeklyWorkouts === undefined
                  ? 'Weekly activity could not be loaded.'
                  : weeklyWorkouts === 0
                    ? 'Completed workout activity will appear here.'
                    : `${weeklyWorkouts} completed ${weeklyWorkouts === 1 ? 'workout' : 'workouts'} this week.`}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-brand-teal/20 bg-brand-dark/50 p-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  {weeklyFormScore === undefined ? 'No workout scores yet' : 'Weekly form score'}
                </span>
              </div>
              <p className="pl-6 text-xs text-gray-400">
                {weeklyFormScore === undefined
                  ? 'Complete a workout with valid form data to track your form quality.'
                  : `Average form score: ${weeklyFormScore}%`}
              </p>
            </div>
          </div>

          <Link to={ROUTES.PROGRESS} className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              View Detailed Progress
            </Button>
          </Link>
        </Card>
      </div>

      {/* Simple Fitness Statistics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="This Week's Weight Lifted"
          value={isLoading ? '…' : progress ? (currentWeek?.totalVolumeKg ?? 0) : '—'}
          unit="kg"
          change={
            weeklyWorkouts === undefined
              ? 'Weekly activity unavailable'
              : `${weeklyWorkouts} completed ${weeklyWorkouts === 1 ? 'workout' : 'workouts'} this week`
          }
          changeType="neutral"
          icon={<Dumbbell className="h-4 w-4" />}
          subtitle="Your workout history"
        />
        <MetricCard
          label="Average Form Score"
          value={weeklyFormScore ?? '—'}
          unit="%"
          change={weeklyFormScore === undefined ? 'No scores this week' : 'Weekly average'}
          changeType="neutral"
          icon={<Activity className="h-4 w-4" />}
          subtitle="From completed workouts"
        />
        <MetricCard
          label="Total Workouts"
          value={isLoading ? '…' : (progress?.totalWorkouts ?? 0)}
          unit="Workouts"
          change={hasWorkouts ? 'Completed sessions' : 'No workouts yet'}
          changeType="neutral"
          icon={<Flame className="h-4 w-4" />}
          subtitle="Your completed sessions"
        />
        <MetricCard
          label="Total Workout Time"
          value={
            progress ? formatDuration(progress.totalWorkoutTimeSeconds) : isLoading ? '…' : '—'
          }
          change={hasWorkouts ? 'Across completed sessions' : 'No time recorded'}
          changeType="neutral"
          icon={<Clock className="h-4 w-4" />}
          subtitle="All completed workouts"
        />
      </div>

      {/* Recent Workouts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Recent Workouts</SectionTitle>
          <Link to={ROUTES.HISTORY} className="text-xs font-medium text-brand-cyan hover:underline">
            View All History &rarr;
          </Link>
        </div>

        {isLoading ? (
          <Card className="p-5 text-sm text-gray-400">Loading your recent workouts…</Card>
        ) : recentWorkouts.length === 0 ? (
          <Card className="p-5 text-sm text-gray-400">Your recent workouts will appear here.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recentWorkouts.map(workout => (
              <Link key={workout.id} to={ROUTES.HISTORY}>
                <Card className="space-y-2 p-5 transition-colors hover:border-brand-cyan/40">
                  <h3 className="font-display text-base font-bold text-white">{workout.title}</h3>
                  <p className="text-xs text-gray-400">
                    {formatDate(workout.endTime ?? workout.startTime)} · {workout.totalReps ?? 0}{' '}
                    reps
                    {' · '}
                    {formatDuration((workout.durationMinutes ?? 0) * 60)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
