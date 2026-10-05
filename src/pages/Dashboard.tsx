import { Link } from 'react-router-dom';
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

export function DashboardPage() {
  const { user } = useAuth();
  const { startSession } = useWorkout();

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

      {/* Hero: What to do now & Today's Workout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Next Recommended Action */}
        <Card className="flex flex-col justify-between border border-brand-teal/30 bg-brand-dark/30 p-6 lg:col-span-7">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Getting Started</Badge>
              <span className="text-xs text-gray-400">Choose a workout to begin</span>
            </div>

            <h2 className="font-display text-2xl font-bold leading-tight tracking-normal text-white">
              Ready for your first workout?
            </h2>

            <p className="text-sm leading-relaxed text-gray-300">
              Your workout history and progress will appear here after you complete a workout.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Exercises</span>
                <span className="block font-sans text-base font-bold text-white">0 Movements</span>
              </div>
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Total Sets</span>
                <span className="block font-sans text-base font-bold text-white">0 Sets</span>
              </div>
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Form Focus</span>
                <span className="block font-sans text-base font-bold text-brand-cyan">—</span>
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
                Weekly Goal
              </span>
              <Badge variant="teal">{user?.weeklyProgressScore ?? 0}% Complete</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300">Workout Frequency Goal</span>
                <span className="font-bold text-brand-cyan">{user?.weeklyProgressScore ?? 0}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                <div
                  className="h-full rounded-full bg-brand-cyan"
                  style={{ width: `${user?.weeklyProgressScore ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Your weekly progress will update as you train.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-brand-teal/20 bg-brand-dark/50 p-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">No workout scores yet</span>
              </div>
              <p className="pl-6 text-xs text-gray-400">
                Complete a workout to start tracking your form quality.
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
          value="0"
          unit="kg"
          change="No workouts yet"
          changeType="neutral"
          icon={<Dumbbell className="h-4 w-4" />}
          subtitle="Your workout history"
        />
        <MetricCard
          label="Average Form Score"
          value="—"
          unit="%"
          change="No scores yet"
          changeType="neutral"
          icon={<Activity className="h-4 w-4" />}
          subtitle="From completed workouts"
        />
        <MetricCard
          label="Workout Streak"
          value={user?.streakDays ?? 0}
          unit="Days"
          change="Current streak"
          changeType="neutral"
          icon={<Flame className="h-4 w-4" />}
          subtitle="Consecutive training days"
        />
        <MetricCard
          label="Workout Time This Week"
          value="0"
          unit="Hours"
          change="No workouts yet"
          changeType="neutral"
          icon={<Clock className="h-4 w-4" />}
          subtitle="This week"
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-5 text-sm text-gray-400">Your recent workouts will appear here.</Card>
        </div>
      </div>
    </PageContainer>
  );
}
