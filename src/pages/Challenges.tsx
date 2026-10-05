import { useState } from 'react';
import { Trophy, Award, Users, Calendar, Plus, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { Button } from '@/components/primitives/Button';
import { MOCK_CHALLENGES } from '@/services/mockData';
import type { Challenge } from '@/types';

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleToggleJoin = (id: string) => {
    setChallenges(prev =>
      prev.map(ch => {
        if (ch.id === id) {
          const isJoining = !ch.isJoined;
          return {
            ...ch,
            isJoined: isJoining,
            participantsCount: isJoining ? ch.participantsCount + 1 : ch.participantsCount - 1,
          };
        }
        return ch;
      }),
    );
  };

  return (
    <PageContainer>
      <PageHeading
        title="Challenges"
        subtitle="Join community fitness challenges, achieve personal goals, and earn badges."
      >
        <Button
          size="md"
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Challenge
        </Button>
      </PageHeading>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-teal/40 bg-brand-dark text-brand-cyan">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold text-white">3 Active</div>
            <div className="text-xs text-gray-400">Joined Challenges</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-teal/40 bg-brand-dark text-brand-cyan">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold text-brand-cyan">8 Earned</div>
            <div className="text-xs text-gray-400">Achievement Badges</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-teal/40 bg-brand-dark text-brand-cyan">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold text-white">2,500+ Members</div>
            <div className="text-xs text-gray-400">Active Community Lifters</div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="space-y-4">
        <SectionTitle>Featured & Active Challenges</SectionTitle>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map(challenge => {
            const percent = Math.min(
              100,
              Math.round((challenge.currentValue / challenge.targetValue) * 100),
            );

            return (
              <Card
                key={challenge.id}
                className="flex flex-col justify-between border-brand-teal/25 p-5 transition-colors hover:border-brand-cyan/40 sm:p-6"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-brand-teal/15 pb-3">
                    <Badge variant="cyan">{challenge.category}</Badge>
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                      <Calendar className="h-3.5 w-3.5" /> Ends {challenge.deadline}
                    </span>
                  </div>

                  {/* Challenge Name & Goal */}
                  <div className="mt-3">
                    <h3 className="font-display text-lg font-bold text-white">{challenge.title}</h3>
                    <p className="mt-1.5 text-xs font-medium text-brand-cyan">
                      Goal: {challenge.goal}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-300">
                      {challenge.description}
                    </p>
                  </div>

                  {/* Progress Bar & Current Value */}
                  <div className="mt-4 space-y-2 border-t border-brand-teal/15 pt-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-400">
                        {challenge.currentValue.toLocaleString()} /{' '}
                        {challenge.targetValue.toLocaleString()} {challenge.unit}
                      </span>
                      <span className="font-bold text-brand-cyan">{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
                      <div
                        className="h-full rounded-full bg-brand-cyan transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Participants, Reward, and Join/Leave Action */}
                <div className="mt-5 space-y-3 border-t border-brand-teal/15 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-amber-300">
                      <Award className="h-4 w-4" />
                      <span>{challenge.rewardBadge}</span>
                    </div>

                    <span className="flex items-center gap-1 text-gray-400">
                      <Users className="h-3.5 w-3.5" />{' '}
                      {challenge.participantsCount.toLocaleString()} lifters
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={challenge.isJoined ? 'outline' : 'primary'}
                    className="w-full"
                    onClick={() => handleToggleJoin(challenge.id)}
                    leftIcon={
                      challenge.isJoined ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-cyan" />
                      ) : undefined
                    }
                  >
                    {challenge.isJoined ? 'Joined • View Progress' : 'Join Challenge'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Challenge Modal Demo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-brand-teal/40 bg-brand-dark p-6 shadow-card">
            <h3 className="font-display text-xl font-bold text-white">Create a Custom Challenge</h3>
            <p className="text-xs text-gray-300">
              Set a personal workout frequency, volume, or form goal to challenge yourself this
              month.
            </p>
            <div className="space-y-3 text-xs text-gray-300">
              <div>
                <label className="mb-1 block text-gray-400">Challenge Name</label>
                <input
                  type="text"
                  placeholder="e.g. 30-Day Push-Up Habit"
                  className="w-full rounded-lg border border-brand-teal/30 bg-brand-black/60 p-2 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-gray-400">Target Goal</label>
                <input
                  type="text"
                  placeholder="e.g. 500 Total Reps"
                  className="w-full rounded-lg border border-brand-teal/30 bg-brand-black/60 p-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(false)}>
                Save & Start Challenge
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
