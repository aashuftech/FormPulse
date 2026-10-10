import { model, Schema, type Document, type Types } from 'mongoose';

export type AuthActionPurpose = 'verify-email' | 'reset-password';

export interface IAuthActionToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  purpose: AuthActionPurpose;
  expiresAt: Date;
  usedAt: Date | null;
}

const authActionTokenSchema = new Schema<IAuthActionToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, select: false },
    purpose: { type: String, enum: ['verify-email', 'reset-password'], required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

authActionTokenSchema.index({ tokenHash: 1 }, { unique: true });
authActionTokenSchema.index({ userId: 1, purpose: 1, usedAt: 1 });
authActionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthActionToken = model<IAuthActionToken>('AuthActionToken', authActionTokenSchema);
