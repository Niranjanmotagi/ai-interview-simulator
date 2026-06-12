import type { Request, Response } from 'express';
import { sendSuccess, buildPaginated } from '../../utils/respond';
import { getAuth } from '../../middleware/auth';
import { Answer, Question } from '../../models';
import * as service from './interview.service';
import { toSessionDetailDto, toSessionDto } from './interview.mapper';

export async function create(req: Request, res: Response): Promise<void> {
  const session = await service.createSession(getAuth(req).sub, req.body);
  const questions = await Question.find({ sessionId: session._id });
  sendSuccess(res, toSessionDetailDto(session, questions, new Set()), 201);
}

export async function list(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const { sessions, answeredCounts, total } = await service.listSessions(
    getAuth(req).sub,
    page,
    limit,
  );
  const items = sessions.map((s) =>
    toSessionDto(s, answeredCounts.get(s._id.toString()) ?? 0),
  );
  sendSuccess(res, buildPaginated(items, total, page, limit));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const userId = getAuth(req).sub;
  const session = await service.getOwnedSession(userId, req.params.id as string);
  const questions = await Question.find({ sessionId: session._id });
  const answers = await Answer.find({ sessionId: session._id }).select('questionId').lean();
  const answeredIds = new Set(answers.map((a) => a.questionId.toString()));
  sendSuccess(res, toSessionDetailDto(session, questions, answeredIds));
}

export async function start(req: Request, res: Response): Promise<void> {
  const session = await service.startSession(getAuth(req).sub, req.params.id as string);
  const counts = await service.answeredCountBySession([session._id]);
  sendSuccess(res, toSessionDto(session, counts.get(session._id.toString()) ?? 0));
}

export async function next(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await service.getNextQuestion(getAuth(req).sub, req.params.id as string));
}

export async function submitAnswer(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await service.submitAnswer(getAuth(req).sub, req.params.id as string, req.body),
    201,
  );
}

export async function complete(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await service.completeSession(getAuth(req).sub, req.params.id as string));
}

export async function summary(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await service.getSummary(getAuth(req).sub, req.params.id as string));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteSession(getAuth(req).sub, req.params.id as string);
  sendSuccess(res, { deleted: true });
}
