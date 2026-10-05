import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Input } from '@/components/primitives/Input';
import { Badge } from '@/components/primitives/Badge';
import { Button } from '@/components/primitives/Button';
import { useWorkout } from '@/hooks/useWorkout';
import { MOCK_EXERCISES } from '@/services/mockData';
import { ROUTES } from '@/lib/constants';
import type { MuscleGroup } from '@/types';

const MUSCLE_GROUPS: (MuscleGroup | 'All')[] = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Core',
];

export function ExercisesPage() {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { startSession } = useWorkout();

  const filteredExercises = useMemo(() => {
    return MOCK_EXERCISES.filter(exercise => {
      const matchesMuscle =
        selectedMuscle === 'All' ||
        exercise.muscleGroup === selectedMuscle ||
        exercise.secondaryMuscles?.includes(selectedMuscle as MuscleGroup);

      const matchesSearch =
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesMuscle && matchesSearch;
    });
  }, [selectedMuscle, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <PageContainer>
      <PageHeading
        title="Exercises"
        subtitle="Learn proper exercise technique, explore form tips, and start guided workouts."
      />

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <Input
              placeholder="Search by exercise name, equipment, or muscle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:col-span-6">
            {MUSCLE_GROUPS.map(muscle => (
              <button
                key={muscle}
                type="button"
                onClick={() => setSelectedMuscle(muscle)}
                className={`whitespace-nowrap rounded-lg border px-3.5 py-2 font-sans text-xs font-medium transition-colors ${
                  selectedMuscle === muscle
                    ? 'border-brand-cyan bg-brand-dark font-semibold text-brand-cyan shadow-sm'
                    : 'border-brand-teal/25 bg-brand-black/60 text-gray-400 hover:text-white'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between px-1 text-xs text-gray-400">
          <span>Showing {filteredExercises.length} exercises</span>
          <span>Camera tracking supported for all movements</span>
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map(exercise => {
          const isExpanded = expandedId === exercise.id;

          return (
            <Card
              key={exercise.id}
              className="flex flex-col justify-between border-brand-teal/25 p-5 transition-colors hover:border-brand-cyan/40 sm:p-6"
            >
              <div>
                {/* Header: Muscle and Difficulty */}
                <div className="flex items-center justify-between border-b border-brand-teal/15 pb-3">
                  <Badge variant="cyan">{exercise.muscleGroup}</Badge>
                  <span className="text-xs font-medium text-gray-400">{exercise.difficulty}</span>
                </div>

                {/* Name and Equipment */}
                <div className="mt-3">
                  <h3 className="font-display text-lg font-bold text-white">{exercise.name}</h3>
                  <p className="mt-1 text-xs text-gray-400">Equipment: {exercise.equipment}</p>
                </div>

                {/* Target Sets and Reps / Duration */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-brand-teal/15 pt-3 text-xs">
                  <div className="rounded-lg border border-brand-teal/15 bg-brand-dark/40 p-2.5">
                    <span className="block text-[11px] text-gray-400">Recommended Sets</span>
                    <span className="mt-0.5 block font-semibold text-white">
                      {exercise.targetSetsDefault} Sets
                    </span>
                  </div>
                  <div className="rounded-lg border border-brand-teal/15 bg-brand-dark/40 p-2.5">
                    <span className="block text-[11px] text-gray-400">
                      {exercise.trackingType === 'duration'
                        ? 'Target Duration'
                        : 'Recommended Reps'}
                    </span>
                    <span className="mt-0.5 block font-semibold text-white">
                      {exercise.trackingType === 'duration'
                        ? `${exercise.targetDurationSeconds ?? 45}s Hold`
                        : `${exercise.targetRepsDefault} Reps`}
                    </span>
                  </div>
                </div>

                {/* How to Perform and Common Mistakes (Expandable) */}
                {isExpanded ? (
                  <div className="mt-4 space-y-4 border-t border-brand-teal/20 pt-4 text-xs">
                    {/* How to Perform */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-white">
                        <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                        How to Perform It:
                      </h4>
                      <ol className="list-inside list-decimal space-y-1 pl-1 leading-relaxed text-gray-300">
                        {exercise.instructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Form Tips */}
                    <div>
                      <h4 className="mb-1.5 font-semibold text-brand-cyan">Key Form Tips:</h4>
                      <ul className="space-y-1 text-gray-300">
                        {exercise.formTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="font-bold text-brand-cyan">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Common Mistakes */}
                    <div className="rounded-lg border border-red-900/30 bg-red-950/30 p-3">
                      <h4 className="mb-1 flex items-center gap-1.5 font-semibold text-red-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Common Mistakes to Avoid:
                      </h4>
                      <ul className="space-y-1 text-[11px] text-red-200/90">
                        {exercise.commonMistakes.map((mistake, idx) => (
                          <li key={idx}>• {mistake}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons: Details and Start Exercise */}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-teal/15 pt-4">
                <button
                  type="button"
                  onClick={() => toggleExpand(exercise.id)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white"
                >
                  {isExpanded ? (
                    <>
                      Hide Details <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      How to do it <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>

                <Link to={ROUTES.WORKOUT}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => startSession(`${exercise.name} Routine`)}
                    leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
                  >
                    Start Exercise
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
