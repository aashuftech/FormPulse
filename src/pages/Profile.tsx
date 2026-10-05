import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [weight, setWeight] = useState(user?.weightKg?.toString() || '');
  const [height, setHeight] = useState(user?.heightCm?.toString() || '');
  const [goal, setGoal] = useState<UserProfile['targetGoal']>(user?.targetGoal || 'Build Muscle');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      weightKg: Number(weight) || 0,
      heightCm: Number(height) || 0,
      targetGoal: goal,
    });
    setIsEditing(false);
  };

  const personalRecords: {
    movement: string;
    record: string;
    setsReps: string;
    formScore: string;
  }[] = [];
  const earnedBadges: { title: string; desc: string }[] = [];

  return (
    <PageContainer>
      <PageHeading
        title="Profile"
        subtitle="Manage your fitness goals, body measurements, and personal records."
      >
        <Button
          size="sm"
          variant={isEditing ? 'ghost' : 'outline'}
          onClick={() => setIsEditing(!isEditing)}
          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
        >
          {isEditing ? 'Cancel Edit' : 'Edit Details'}
        </Button>
      </PageHeading>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Card / Body & Fitness Details */}
        <Card className="space-y-6 border border-brand-teal/30 bg-brand-dark/30 p-6 lg:col-span-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-brand-cyan bg-brand-dark font-sans text-xl font-bold text-brand-cyan shadow-sm">
              {(user?.name ?? 'User')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(part => part[0]?.toUpperCase() ?? '')
                .join('')}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold leading-tight tracking-normal text-white">
                {user?.name}
              </h2>
              <p className="font-sans text-xs text-gray-400">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="cyan">{user?.athleteLevel}</Badge>
                <Badge variant="dark">{user?.targetGoal}</Badge>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 border-t border-brand-teal/20 pt-4 text-center">
            <div className="rounded-xl border border-brand-teal/15 bg-brand-black/60 p-3">
              <span className="block text-xs font-medium text-gray-400">Streak</span>
              <span className="mt-0.5 block font-sans text-base font-bold text-white">
                {user?.streakDays} Days
              </span>
            </div>
            <div className="rounded-xl border border-brand-teal/15 bg-brand-black/60 p-3">
              <span className="block text-xs font-medium text-gray-400">Weight</span>
              <span className="mt-0.5 block font-sans text-base font-bold text-brand-cyan">
                {user?.weightKg} kg
              </span>
            </div>
            <div className="rounded-xl border border-brand-teal/15 bg-brand-black/60 p-3">
              <span className="block text-xs font-medium text-gray-400">Height</span>
              <span className="mt-0.5 block font-sans text-base font-bold text-white">
                {user?.heightCm} cm
              </span>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleSave} className="space-y-3.5 border-t border-brand-teal/20 pt-4">
              <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300">
                  Primary Fitness Goal
                </label>
                <select
                  value={goal}
                  onChange={e => setGoal(e.target.value as UserProfile['targetGoal'])}
                  className="w-full rounded-lg border border-brand-teal/30 bg-brand-black/60 p-2 text-xs text-white"
                >
                  <option value="Build Muscle">Build Muscle</option>
                  <option value="Build Strength">Build Strength</option>
                  <option value="Increase Endurance">Increase Endurance</option>
                  <option value="Lose Fat">Lose Fat</option>
                  <option value="Improve Mobility">Improve Mobility</option>
                </select>
              </div>
              <Button type="submit" variant="primary" size="sm" className="mt-2 w-full">
                Save Body Details
              </Button>
            </form>
          )}

          {/* Earned Badges Showcase */}
          <div className="space-y-3 border-t border-brand-teal/20 pt-4">
            <h4 className="font-display text-sm font-bold leading-tight tracking-normal text-white">
              Earned Achievement Badges
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {earnedBadges.length === 0 && (
                <p className="col-span-2 text-xs text-gray-400">No achievement badges yet.</p>
              )}
              {earnedBadges.map((badge, idx) => {
                return (
                  <div
                    key={idx}
                    className="space-y-1 rounded-xl border border-brand-teal/20 bg-brand-dark/50 p-3"
                  >
                    <div className="flex items-center gap-1.5 text-brand-cyan">
                      <span className="text-xs font-semibold text-white">{badge.title}</span>
                    </div>
                    <p className="text-[11px] leading-tight text-gray-400">{badge.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Personal Records Showcase */}
        <div className="space-y-4 lg:col-span-7">
          <SectionTitle>Personal Records</SectionTitle>

          <div className="space-y-3">
            {personalRecords.length === 0 && (
              <Card className="border-brand-teal/20 bg-brand-dark/25 p-5 text-sm text-gray-400">
                Your personal records will appear after you complete workouts.
              </Card>
            )}
            {personalRecords.map((pr, idx) => (
              <Card key={idx} className="border-brand-teal/20 bg-brand-dark/25 p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-display text-base font-bold leading-tight tracking-normal text-white">
                      {pr.movement}
                    </h4>
                    <p className="text-xs text-gray-400">Best: {pr.setsReps}</p>
                  </div>

                  <div className="text-right">
                    <div className="font-sans text-xl font-bold text-brand-cyan">{pr.record}</div>
                    <Badge variant="cyan" size="sm">
                      {pr.formScore} Form Quality
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
