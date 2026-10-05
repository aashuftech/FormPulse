import { Link } from 'react-router-dom';
import {
  Activity,
  Flame,
  Dumbbell,
  Clock,
  ArrowRight,
  Play,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { MetricCard } from '@/components/primitives/MetricCard';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useWorkout } from '@/hooks/useWorkout';
import { MOCK_WORKOUT_HISTORY } from '@/services/mockData';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/utils/formatters';

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
            onClick={() => startSession('Leg Day & Core Routine')}
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
              <Badge variant="cyan">Recommended Today</Badge>
              <span className="text-xs text-gray-400">Estimated duration: 45-55 mins</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-white">Leg Day & Core Strength</h2>

            <p className="text-sm leading-relaxed text-gray-300">
              You are on a 14-day consistency streak! Today's plan targets your quads, hamstrings,
              and core with real-time squat depth guidance.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Exercises</span>
                <span className="block font-display text-base font-bold text-white">
                  3 Movements
                </span>
              </div>
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Total Sets</span>
                <span className="block font-display text-base font-bold text-white">10 Sets</span>
              </div>
              <div className="rounded-lg border border-brand-teal/20 bg-brand-dark/60 p-3 text-center">
                <span className="block text-xs text-gray-400">Form Focus</span>
                <span className="block font-display text-base font-bold text-brand-cyan">
                  Squat Depth
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-brand-teal/20 pt-6">
            <Link to={ROUTES.WORKOUT}>
              <Button
                variant="primary"
                size="md"
                onClick={() => startSession('Leg Day & Core Routine')}
                leftIcon={<Play className="h-4 w-4 fill-current" />}
              >
                Start This Workout
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
              <span className="font-display text-base font-semibold text-white">Weekly Goal</span>
              <Badge variant="teal">3 of 4 Done</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300">Workout Frequency Goal</span>
                <span className="font-bold text-brand-cyan">75%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                <div className="h-full w-[75%] rounded-full bg-brand-cyan" />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Complete today's session to hit your 4-workout weekly target.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-brand-teal/20 bg-brand-dark/50 p-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Form Quality Average: 94%</span>
              </div>
              <p className="pl-6 text-xs text-gray-400">
                Your back posture during deadlifts improved significantly this week.
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
          value="28,200"
          unit="kg"
          change="+1,800 kg"
          changeType="positive"
          icon={<Dumbbell className="h-4 w-4" />}
          subtitle="Across 3 completed workouts"
        />
        <MetricCard
          label="Average Form Score"
          value="94"
          unit="%"
          change="+4% this month"
          changeType="positive"
          icon={<Activity className="h-4 w-4" />}
          subtitle="Clean reps on all major lifts"
        />
        <MetricCard
          label="Workout Streak"
          value="14"
          unit="Days"
          change="Personal Best!"
          changeType="positive"
          icon={<Flame className="h-4 w-4" />}
          subtitle="Unbroken workout consistency"
        />
        <MetricCard
          label="Workout Time This Week"
          value="2.8"
          unit="Hours"
          change="On track"
          changeType="neutral"
          icon={<Clock className="h-4 w-4" />}
          subtitle="Average 52 mins per workout"
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
          {MOCK_WORKOUT_HISTORY.map(session => (
            <Card key={session.id} variant="interactive" className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5 text-brand-cyan" />
                    {formatDate(session.startTime)}
                  </span>
                  <h3 className="font-display text-base font-bold text-white">{session.title}</h3>
                  <p className="mt-0.5 text-xs text-gray-400">{session.description}</p>
                </div>
                <Badge variant="cyan">{session.averageFormScore}% Form</Badge>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-brand-teal/15 pt-3 text-xs text-gray-300">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-brand-cyan" /> {session.durationMinutes} mins
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5 text-brand-cyan" />{' '}
                  {session.totalVolumeKg.toLocaleString()} kg lifted
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame className="h-3.5 w-3.5" /> {session.caloriesBurned} kcal
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
