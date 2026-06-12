import { Schema, model, type Document, type Types } from 'mongoose';
import type { ParsedProfile, ResumeAnalysis, ResumeStatus } from '@ai-interview/types';

export interface ResumeDoc extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  fileUrl: string | null;
  fileName: string;
  rawText: string;
  parsedProfile: ParsedProfile | null;
  analysis: ResumeAnalysis | null;
  status: ResumeStatus;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<ResumeDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, default: null },
    fileName: { type: String, required: true },
    rawText: { type: String, required: true },
    parsedProfile: {
      type: {
        skills: [String],
        experience: [{ title: String, company: String, duration: String, bullets: [String] }],
        education: [{ degree: String, institution: String, year: String }],
        projects: [{ name: String, summary: String }],
      },
      default: null,
      _id: false,
    },
    analysis: {
      type: {
        strengths: [String],
        weaknesses: [String],
        atsKeywordGaps: [String],
        suggestedRewrites: [{ original: String, improved: String }],
        overallScore: Number,
      },
      default: null,
      _id: false,
    },
    status: {
      type: String,
      enum: ['uploaded', 'parsed', 'analyzed', 'failed'],
      default: 'uploaded',
      index: true,
    },
  },
  { timestamps: true },
);

resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = model<ResumeDoc>('Resume', resumeSchema);
