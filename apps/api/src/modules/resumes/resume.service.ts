import { Types } from 'mongoose';
import { Resume, User, type ResumeDoc } from '../../models';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';
import { getAIService } from '../../ai';
import {
  buildResumeAnalysisPrompt,
  buildResumeStructurePrompt,
} from '../../ai/prompts';
import { parsedProfileSchema, resumeAnalysisSchema } from '../../ai/schemas';
import { recordUsage } from '../../services/usage.service';
import { extractResumeText } from './resume.parser';
import { removeOriginal, saveOriginal } from './resume.storage';

export async function uploadResume(
  userId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
): Promise<ResumeDoc> {
  const rawText = await extractResumeText(file.buffer, file.mimetype);

  const resume = await Resume.create({
    userId,
    fileName: sanitizeFileName(file.originalname),
    rawText,
    status: 'parsed',
  });

  resume.fileUrl = await saveOriginal(userId, resume._id.toString(), file.buffer, file.mimetype);
  await resume.save();

  return resume;
}

/**
 * Two-pass AI pipeline: structure (fast model) then analysis (smart model).
 * Results are cached on the document — re-running is an explicit user action,
 * which keeps free-tier AI costs bounded.
 */
export async function analyzeResume(userId: string, resumeId: string): Promise<ResumeDoc> {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw ApiError.notFound('Resume');
  }
  if (resume.status === 'analyzed' && resume.analysis) {
    return resume; // cached — explicit re-analyze would reset status first
  }

  const ai = getAIService();
  const user = await User.findById(userId).lean();

  try {
    const structure = await ai.generateJson(
      buildResumeStructurePrompt(resume.rawText),
      parsedProfileSchema,
    );
    await recordUsage(userId, 'resume_structure', structure.usage);
    resume.parsedProfile = structure.data;

    const analysis = await ai.generateJson(
      buildResumeAnalysisPrompt(resume.rawText, structure.data, user?.targetRoles ?? []),
      resumeAnalysisSchema,
    );
    await recordUsage(userId, 'resume_analysis', analysis.usage);
    resume.analysis = analysis.data;
    resume.status = 'analyzed';
    await resume.save();
    return resume;
  } catch (err) {
    resume.status = 'failed';
    await resume.save().catch((saveErr) => {
      logger.error({ err: saveErr, resumeId }, 'Failed to mark resume as failed');
    });
    throw err;
  }
}

export async function listResumes(userId: string): Promise<ResumeDoc[]> {
  return Resume.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function getResume(userId: string, resumeId: string): Promise<ResumeDoc> {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw ApiError.notFound('Resume');
  }
  return resume;
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const resume = await Resume.findOneAndDelete({ _id: resumeId, userId });
  if (!resume) {
    throw ApiError.notFound('Resume');
  }
  await removeOriginal(resume.fileUrl);
}

export async function getLatestAnalyzed(userId: string): Promise<ResumeDoc | null> {
  return Resume.findOne({ userId: new Types.ObjectId(userId), status: 'analyzed' }).sort({
    createdAt: -1,
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\- ()]/g, '_').slice(0, 140) || 'resume';
}
