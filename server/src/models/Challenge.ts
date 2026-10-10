import { model, Schema, type Document, type Types } from 'mongoose';

export const CHALLENGE_CATEGORIES = [
  'Form Quality',
  'Workout Volume',
  'Consistency',
  'Streak',
] as const;
export const CHALLENGE_METRICS = [
  'reps',
  'sets',
  'workouts',
  'volumeKg',
  'calories',
  'durationSeconds',
  'formScore',
] as const;
export type ChallengeMetric = (typeof CHALLENGE_METRICS)[number];

export interface IChallenge extends Document {
  userId: Types.ObjectId;
  title: string;
  category: (typeof CHALLENGE_CATEGORIES)[number];
  goal: string;
  description: string;
  targetValue: number;
  currentValue: number;
  metric: ChallengeMetric;
  unit: string;
  deadline: Date;
  rewardBadge: string;
  participantsCount: number;
  status: 'active' | 'completed';
  isJoined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    category: { type: String, enum: CHALLENGE_CATEGORIES, required: true },
    goal: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, maxlength: 200 },
    targetValue: { type: Number, required: true, min: 1, max: 1_000_000_000 },
    currentValue: { type: Number, required: true, min: 0, default: 0 },
    metric: { type: String, enum: CHALLENGE_METRICS, required: true },
    unit: { type: String, required: true, maxlength: 50 },
    deadline: { type: Date, required: true },
    rewardBadge: { type: String, required: true, maxlength: 50 },
    participantsCount: { type: Number, required: true, min: 1, default: 1 },
    status: { type: String, enum: ['active', 'completed'], required: true, default: 'active' },
    isJoined: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

challengeSchema.index({ userId: 1, createdAt: -1 });

export const Challenge = model<IChallenge>('Challenge', challengeSchema);
