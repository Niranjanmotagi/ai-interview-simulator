import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Refresh tokens are stored hashed (HMAC-SHA256) — a DB leak does not leak
 * usable tokens. `family` groups a rotation chain: when a revoked token is
 * presented again (replay), the whole family is revoked and the user must
 * re-authenticate.
 */
export interface RefreshTokenDoc extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  revoked: boolean;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL: Mongo removes expired docs automatically — no cron needed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema);
