import { useEffect, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types';
import { workoutService, type WorkoutProgress } from '@/services/workoutService';
import { formatDuration } from '@/utils/formatters';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [weight, setWeight] = useState(user?.weightKg?.toString() || '');
  const [height, setHeight] = useState(user?.heightCm?.toString() || '');
  const [goal, setGoal] = useState<UserProfile['targetGoal']>(user?.targetGoal || 'Build Muscle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<WorkoutProgress | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setWeight(user.weightKg ? String(user.weightKg) : '');
    setHeight(user.heightCm ? String(user.heightCm) : '');
    setGoal(user.targetGoal);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    workoutService
      .getProgress()
      .then(result => {
        if (mounted) setProgress(result);
      })
      .catch(error => {
        if (mounted) {
          setProgressError(
            error instanceof Error ? error.message : 'Personal records could not be loaded.',
          );
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingProgress(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await updateUser({
        name: name.trim(),
        weightKg: Number(weight),
        heightCm: Number(height),
        targetGoal: goal,
      });
      setSaveMessage('Profile details saved.');
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const records = progress?.personalRecords;
  const personalRecords: { movement: string; record: string; detail: string }[] = [];
  if (records?.highestRepsPerSet !== undefined) {
    personalRecords.push({
      movement: 'Highest reps per set',
      record: `${records.highestRepsPerSet} reps`,
      detail: 'Personal best',
    });
  }
  if (records?.longestPlankSeconds !== undefined) {
    personalRecords.push({
      movement: 'Longest plank',
      record: formatDuration(records.longestPlankSeconds),
      detail: 'Personal best',
    });
  }
  if (records?.bestFormScore !== undefined) {
    personalRecords.push({
      movement: 'Best form score',
      record: `${records.bestFormScore}%`,
      detail: 'Estimated coaching score',
    });
  }
  if (records?.highestWeightKg !== undefined) {
    personalRecords.push({
      movement: 'Highest set weight',
      record: `${records.highestWeightKg} kg`,
      detail: 'Personal best',
    });
  }
  if (records?.highestSetVolumeKg !== undefined) {
    personalRecords.push({
      movement: 'Highest set volume',
      record: `${records.highestSetVolumeKg.toLocaleString()} kg`,
      detail: 'Personal best',
    });
  }
  if (records?.highestWorkoutVolumeKg !== undefined) {
    personalRecords.push({
      movement: 'Highest workout volume',
      record: `${records.highestWorkoutVolumeKg.toLocaleString()} kg`,
      detail: 'Personal best',
    });
  }
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
          onClick={() => {
            if (isEditing && user) {
              setName(user.name);
              setWeight(user.weightKg ? String(user.weightKg) : '');
              setHeight(user.heightCm ? String(user.heightCm) : '');
              setGoal(user.targetGoal);
              setSaveError(null);
            }
            setIsEditing(!isEditing);
          }}
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
              <span className="block text-xs font-medium text-gray-400">Workouts</span>
              <span className="mt-0.5 block font-sans text-base font-bold text-white">
                {isLoadingProgress ? '…' : (progress?.totalWorkouts ?? 0)} Completed
              </span>
            </div>
            <div className="rounded-xl border border-brand-teal/15 bg-brand-black/60 p-3">
              <span className="block text-xs font-medium text-gray-400">Weight</span>
              <span className="mt-0.5 block font-sans text-base font-bold text-brand-cyan">
                {user?.weightKg ? `${user.weightKg} kg` : '—'}
              </span>
            </div>
            <div className="rounded-xl border border-brand-teal/15 bg-brand-black/60 p-3">
              <span className="block text-xs font-medium text-gray-400">Height</span>
              <span className="mt-0.5 block font-sans text-base font-bold text-white">
                {user?.heightCm ? `${user.heightCm} cm` : '—'}
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
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="mt-2 w-full"
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save Body Details'}
              </Button>
              {saveError && (
                <p role="alert" className="text-xs text-red-400">
                  {saveError}
                </p>
              )}
            </form>
          )}
          {saveMessage && (
            <p role="status" className="text-xs text-emerald-400">
              {saveMessage}
            </p>
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

          {progressError && (
            <p role="alert" className="text-sm text-red-400">
              {progressError}
            </p>
          )}

          <div className="space-y-3">
            {isLoadingProgress && (
              <Card className="border-brand-teal/20 bg-brand-dark/25 p-5 text-sm text-gray-400">
                Loading your personal records…
              </Card>
            )}
            {!isLoadingProgress && !progressError && personalRecords.length === 0 && (
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
                    <p className="text-xs text-gray-400">{pr.detail}</p>
                  </div>

                  <div className="text-right">
                    <div className="font-sans text-xl font-bold text-brand-cyan">{pr.record}</div>
                    <Badge variant="cyan" size="sm">
                      Personal Record
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
