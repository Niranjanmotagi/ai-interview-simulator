import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Local-disk storage for original resume files, namespaced per user and keyed
 * by resume id (never by user-supplied filename — no path traversal surface).
 *
 * Render's disk is ephemeral; the application only depends on `rawText`
 * persisted in MongoDB, so losing originals degrades nothing functional.
 * For durable originals, replace this module with an S3-compatible client —
 * the call sites (save/remove) are the only integration points.
 */

function extensionFor(mimeType: string): string {
  return mimeType === 'application/pdf' ? '.pdf' : '.docx';
}

export async function saveOriginal(
  userId: string,
  resumeId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    const dir = path.resolve(env.UPLOAD_DIR, userId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${resumeId}${extensionFor(mimeType)}`);
    await fs.writeFile(filePath, buffer);
    return path.relative(path.resolve(env.UPLOAD_DIR), filePath).split(path.sep).join('/');
  } catch (err) {
    logger.warn({ err, resumeId }, 'Failed to persist original resume file (non-fatal)');
    return null;
  }
}

export async function removeOriginal(fileUrl: string | null): Promise<void> {
  if (!fileUrl) {
    return;
  }
  try {
    const resolved = path.resolve(env.UPLOAD_DIR, fileUrl);
    // Defense in depth: never delete outside the upload root.
    if (!resolved.startsWith(path.resolve(env.UPLOAD_DIR))) {
      return;
    }
    await fs.unlink(resolved);
  } catch {
    // Already gone (ephemeral disk) — nothing to do.
  }
}

export async function removeAllForUser(userId: string): Promise<void> {
  try {
    if (!/^[a-f\d]{24}$/i.test(userId)) {
      return;
    }
    await fs.rm(path.resolve(env.UPLOAD_DIR, userId), { recursive: true, force: true });
  } catch {
    // Best-effort cleanup.
  }
}
