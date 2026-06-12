import type { Response } from 'express';
import type { ApiSuccess, Paginated } from '@ai-interview/types';

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export function buildPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
