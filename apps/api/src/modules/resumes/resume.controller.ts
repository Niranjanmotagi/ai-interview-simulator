import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/respond';
import { getAuth } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import * as service from './resume.service';
import { toResumeDto, toResumeListItemDto } from './resume.mapper';

export async function upload(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded. Send the resume as multipart field "file".');
  }
  const resume = await service.uploadResume(getAuth(req).sub, req.file);
  sendSuccess(res, toResumeDto(resume), 201);
}

export async function analyze(req: Request, res: Response): Promise<void> {
  const resume = await service.analyzeResume(getAuth(req).sub, req.params.id as string);
  sendSuccess(res, toResumeDto(resume));
}

export async function list(req: Request, res: Response): Promise<void> {
  const resumes = await service.listResumes(getAuth(req).sub);
  sendSuccess(res, resumes.map(toResumeListItemDto));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const resume = await service.getResume(getAuth(req).sub, req.params.id as string);
  sendSuccess(res, toResumeDto(resume));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteResume(getAuth(req).sub, req.params.id as string);
  sendSuccess(res, { deleted: true });
}
