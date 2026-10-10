export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Full Body';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  difficulty: DifficultyLevel;
  equipment: string;
  trackingType?: 'reps' | 'duration';
  targetDurationSeconds?: number;
  instructions: string[];
  formTips: string[];
  commonMistakes: string[];
  targetRepsDefault: number;
  targetSetsDefault: number;
}

export interface WorkoutSet {
  id?: string;
  setNumber: number;
  reps?: number;
  durationSeconds?: number;
  estimatedCalories?: number;
  targetReps?: number;
  targetDurationSeconds?: number;
  weightKg?: number;
  completed: boolean;
  accuracyScore?: number; // 0-100 Form accuracy score
}

export interface WorkoutExerciseItem {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  exercises: WorkoutExerciseItem[];
  status: 'draft' | 'in-progress' | 'completed' | 'abandoned';
  averageFormScore?: number;
  caloriesBurned?: number;
  totalVolumeKg: number;
  totalReps?: number;
  summary?: WorkoutSummary;
}

export interface WorkoutSummary {
  exercisesCompleted: number;
  totalSets: number;
  totalReps: number;
  plankDurationSeconds: number;
  durationSeconds: number;
  estimatedCalories?: number;
  averageFormScore?: number;
  totalVolumeKg: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  avatarUrl?: string;
  athleteLevel: DifficultyLevel;
  experienceYears: number;
  targetGoal:
    'Build Muscle' | 'Build Strength' | 'Increase Endurance' | 'Lose Fat' | 'Improve Mobility';
  weightKg: number;
  heightCm: number;
  joinedDate: string;
  streakDays: number;
  weeklyProgressScore: number; // 0-100 score for weekly consistency
}

export type UserProfileUpdate = Pick<UserProfile, 'name' | 'targetGoal' | 'weightKg' | 'heightCm'>;

export interface FitnessMetricPoint {
  date: string;
  weightKg?: number;
  bodyFatPercent?: number;
  avgFormScore?: number;
  workoutDurationMinutes?: number;
  volumeKg?: number;
  repsCount?: number;
}

export interface Challenge {
  id: string;
  title: string;
  category: 'Form Quality' | 'Workout Volume' | 'Consistency' | 'Streak';
  goal: string;
  description: string;
  targetValue: number;
  currentValue: number;
  metric?: 'reps' | 'sets' | 'workouts' | 'volumeKg' | 'calories' | 'durationSeconds' | 'formScore';
  unit: string;
  deadline: string;
  rewardBadge: string;
  participantsCount: number;
  status: 'active' | 'completed' | 'available';
  isJoined: boolean;
}

export interface UserSettings {
  voiceGuidance: boolean;
  vibrationAlerts: boolean;
  formStrictness: 'Relaxed' | 'Standard' | 'Strict';
  unitSystem: 'Metric (kg)' | 'Imperial (lbs)';
  emailNotifications: boolean;
  theme: 'dark';
}
