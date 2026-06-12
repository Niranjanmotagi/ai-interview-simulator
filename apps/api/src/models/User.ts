import { Schema, model, type Document, type Types } from 'mongoose';
import type { ExperienceLevel, Plan, UserRole } from '@ai-interview/types';

export interface UserDoc extends Document<Types.ObjectId> {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  targetRoles: string[];
  experienceLevel: ExperienceLevel | null;
  plan: Plan;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // select:false keeps hashes out of every query unless explicitly requested.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    emailVerified: { type: Boolean, default: false },
    targetRoles: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ['student', 'grad', 'mid', 'switcher'],
      default: null,
    },
    plan: { type: String, enum: ['free', 'pro', 'pro_plus'], default: 'free', index: true },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

export const User = model<UserDoc>('User', userSchema);
