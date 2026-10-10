import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Award, Users, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading, SectionTitle } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { Button } from '@/components/primitives/Button';
import { challengeService } from '@/services/challengeService';
import type { Challenge } from '@/types';

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeName, setChallengeName] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    void challengeService
      .list()
      .then(setChallenges)
      .catch(error =>
        setListError(
          error instanceof Error ? error.message : 'Saved challenges could not be loaded.',
        ),
      )
      .finally(() => setIsLoadingChallenges(false));
  }, []);

  const handleCreateChallenge = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingChallenge) return;
    setIsSavingChallenge(true);
    setCreateError(null);
    try {
      if (editingChallenge) {
        const challenge = await challengeService.update(editingChallenge.id, {
          title: challengeName,
          goal: targetGoal,
        });
        setChallenges(previous =>
          previous.map(item => (item.id === challenge.id ? challenge : item)),
        );
      } else {
        const challenge = await challengeService.create(challengeName, targetGoal);
        setChallenges(previous => [challenge, ...previous]);
      }
      setChallengeName('');
      setTargetGoal('');
      setEditingChallenge(null);
      setShowCreateModal(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Challenge could not be saved.');
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!window.confirm('Delete this challenge? This cannot be undone.')) return;
    setDeletingChallengeId(id);
    setListError(null);
    try {
      await challengeService.remove(id);
      setChallenges(previous => previous.filter(challenge => challenge.id !== id));
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Challenge could not be deleted.');
    } finally {
      setDeletingChallengeId(null);
    }
  };

  const activeCount = challenges.filter(challenge => challenge.status === 'active').length;
  const completedCount = challenges.filter(challenge => challenge.status === 'completed').length;

  return (
    <PageContainer>
      <PageHeading
        title="Challenges"
        subtitle="Create personal fitness challenges and track your progress."
      >
        <Button
          size="md"
          variant="primary"
          onClick={() => {
            setEditingChallenge(null);
            setChallengeName('');
            setTargetGoal('');
            setCreateError(null);
            setShowCreateModal(true);
          }}
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
            <div className="font-sans text-xl font-bold text-white">{activeCount} Active</div>
            <div className="text-xs text-gray-400">Personal Challenges</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-teal/40 bg-brand-dark text-brand-cyan">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="font-sans text-xl font-bold text-brand-cyan">{completedCount} Done</div>
            <div className="text-xs text-gray-400">Completed Challenges</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-teal/40 bg-brand-dark text-brand-cyan">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="font-sans text-xl font-bold text-white">{challenges.length}</div>
            <div className="text-xs text-gray-400">Your Total Challenges</div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="space-y-4">
        <SectionTitle>Your Challenges</SectionTitle>

        {listError && (
          <p role="alert" className="text-sm text-red-400">
            {listError}
          </p>
        )}

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
                    <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                      {challenge.title}
                    </h3>
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

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={challenge.status === 'completed'}
                      onClick={() => {
                        setEditingChallenge(challenge);
                        setChallengeName(challenge.title);
                        setTargetGoal(challenge.goal);
                        setCreateError(null);
                        setShowCreateModal(true);
                      }}
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    >
                      {challenge.status === 'completed' ? 'Completed' : 'Edit Challenge'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingChallengeId === challenge.id}
                      onClick={() => void handleDeleteChallenge(challenge.id)}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      {deletingChallengeId === challenge.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {isLoadingChallenges && <p className="text-sm text-gray-400">Loading your challenges…</p>}
        {!isLoadingChallenges && !listError && challenges.length === 0 && (
          <Card className="border-brand-teal/25 p-6 text-center text-sm text-gray-400">
            You have no challenges yet. Create one to start tracking your progress.
          </Card>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <form
              onSubmit={event => void handleCreateChallenge(event)}
              className="w-full max-w-md space-y-4 rounded-2xl border border-brand-teal/40 bg-brand-dark p-6 shadow-card"
            >
              <h3 className="font-display text-xl font-bold leading-tight tracking-normal text-white">
                {editingChallenge ? 'Update Your Challenge' : 'Create a Custom Challenge'}
              </h3>
              <p className="text-xs text-gray-300">
                Set a personal workout frequency, volume, or form goal to challenge yourself this
                month.
              </p>
              <div className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="mb-1 block text-gray-400" htmlFor="challenge-name">
                    Challenge Name
                  </label>
                  <input
                    id="challenge-name"
                    type="text"
                    placeholder="e.g. 30-Day Push-Up Habit"
                    value={challengeName}
                    onChange={event => setChallengeName(event.target.value)}
                    maxLength={80}
                    required
                    className="w-full rounded-lg border border-brand-teal/30 bg-brand-black/60 p-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-gray-400" htmlFor="challenge-goal">
                    Target Goal
                  </label>
                  <input
                    id="challenge-goal"
                    type="text"
                    placeholder="e.g. 500 Total Reps"
                    value={targetGoal}
                    onChange={event => setTargetGoal(event.target.value)}
                    maxLength={150}
                    required
                    className="w-full rounded-lg border border-brand-teal/30 bg-brand-black/60 p-2 text-white"
                  />
                </div>
              </div>
              {createError && (
                <p role="alert" className="text-xs text-red-400">
                  {createError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  disabled={isSavingChallenge}
                  onClick={() => {
                    setCreateError(null);
                    setEditingChallenge(null);
                    setShowCreateModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSavingChallenge}>
                  {isSavingChallenge
                    ? 'Saving…'
                    : editingChallenge
                      ? 'Save Challenge'
                      : 'Save & Start Challenge'}
                </Button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </PageContainer>
  );
}
