import { Activity, Calendar, Flame, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { MetricCard } from '@/components/primitives/MetricCard';
import { Badge } from '@/components/primitives/Badge';
import { MOCK_METRIC_POINTS } from '@/services/mockData';
import { formatDate } from '@/utils/formatters';

export function ProgressPage() {
  const muscleDistribution = [
    { name: 'Legs (Squats & Deadlifts)', percent: 35 },
    { name: 'Chest & Push Movements', percent: 25 },
    { name: 'Back & Pull-Ups', percent: 20 },
    { name: 'Shoulders & Arms', percent: 12 },
    { name: 'Core & Abdominals', percent: 8 },
  ];

  return (
    <PageContainer>
      <PageHeading
        title="My Progress"
        subtitle="Track your form improvements, weekly workout frequency, total reps, and lifted volume over time."
      />

      {/* High-level Progress Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Form Improvement */}
        <MetricCard
          label="Average Form Score"
          value="94"
          unit="%"
          change="+6% this month"
          changeType="positive"
          icon={<Activity className="h-4 w-4" />}
          subtitle="Consistently clean reps"
        />

        {/* Workout Frequency */}
        <MetricCard
          label="Workout Frequency"
          value="4"
          unit="days/wk"
          change="100% of goal"
          changeType="positive"
          icon={<Calendar className="h-4 w-4" />}
          subtitle="4 workouts completed this week"
        />

        {/* Total Reps */}
        <MetricCard
          label="Completed Reps (This Week)"
          value="220"
          unit="Reps"
          change="+15 reps vs last week"
          changeType="positive"
          icon={<CheckCircle2 className="h-4 w-4" />}
          subtitle="100% verified full range"
        />

        {/* Calories Burned */}
        <MetricCard
          label="Estimated Calories"
          value="1,920"
          unit="kcal"
          change="On track"
          changeType="neutral"
          icon={<Flame className="h-4 w-4" />}
          subtitle="Across 4 workouts"
        />
      </div>

      {/* Useful Visual Charts & Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Weekly Weight Lifted Trend Chart */}
        <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
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
            {MOCK_METRIC_POINTS.map(point => {
              const maxVol = 32000;
              const barWidth = point.volumeKg ? Math.round((point.volumeKg / maxVol) * 100) : 50;

              return (
                <div key={point.date} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-300">{formatDate(point.date)}</span>
                    <span className="font-semibold text-white">
                      {point.volumeKg?.toLocaleString()} kg lifted • {point.avgFormScore}% Form
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
              <h3 className="font-display text-lg font-semibold text-white">
                Workout Distribution
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">Balance across major muscle groups</p>
            </div>
            <Badge variant="teal">Balanced</Badge>
          </div>

          <div className="space-y-3.5 pt-2">
            {muscleDistribution.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="font-semibold text-brand-cyan">{item.percent}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                  <div
                    className="h-full rounded-full bg-brand-cyan"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 rounded-xl border border-brand-teal/20 bg-brand-dark/60 p-3.5 text-xs text-gray-300">
            <span className="block font-semibold text-white">FormPulse Coaching Tip:</span>
            Your upper and lower body workout volume is well-balanced. Keep up the consistent squat
            form!
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
