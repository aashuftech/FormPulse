import { model, Schema, type Document, type Types } from 'mongoose';

export interface IRefreshSession extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  rotatedTokenHashes: string[];
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string;
  ipAddress: string;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, select: false },
    rotatedTokenHashes: { type: [String], default: [], select: false },
    createdAt: { type: Date, required: true, default: Date.now },
    lastUsedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, maxlength: 512, default: '' },
    ipAddress: { type: String, maxlength: 128, default: '' },
  },
  { versionKey: false },
);

refreshSessionSchema.index({ tokenHash: 1 }, { unique: true });
refreshSessionSchema.index({ rotatedTokenHashes: 1 }, { sparse: true });
refreshSessionSchema.index({ userId: 1, revokedAt: 1, lastUsedAt: -1, expiresAt: 1 });
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession = model<IRefreshSession>('RefreshSession', refreshSessionSchema);
