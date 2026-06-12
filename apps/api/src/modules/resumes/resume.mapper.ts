import type { ResumeDto, ResumeListItemDto } from '@ai-interview/types';
import type { ResumeDoc } from '../../models';

export function toResumeDto(doc: ResumeDoc): ResumeDto {
  return {
    id: doc._id.toString(),
    fileName: doc.fileName,
    status: doc.status,
    parsedProfile: doc.parsedProfile,
    analysis: doc.analysis,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toResumeListItemDto(doc: ResumeDoc): ResumeListItemDto {
  return {
    id: doc._id.toString(),
    fileName: doc.fileName,
    status: doc.status,
    overallScore: doc.analysis?.overallScore ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}
