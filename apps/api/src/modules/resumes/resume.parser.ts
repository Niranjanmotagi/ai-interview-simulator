import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ApiError } from '../../utils/ApiError';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const MIN_EXTRACTED_CHARS = 120;
const MAX_EXTRACTED_CHARS = 60_000;

/**
 * Extracts plain text from an uploaded resume buffer.
 * Hard-fails on scanned/empty documents instead of feeding garbage to the AI.
 */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  let text: string;

  try {
    if (mimeType === 'application/pdf') {
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (ALLOWED_MIME_TYPES.has(mimeType)) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      throw ApiError.badRequest('Unsupported file type. Upload a PDF or DOCX resume.');
    }
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw ApiError.unprocessable(
      'Could not read this file. Make sure it is a valid, non-corrupted PDF or DOCX.',
    );
  }

  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (normalized.length < MIN_EXTRACTED_CHARS) {
    throw ApiError.unprocessable(
      'This file contains almost no extractable text. Scanned/image-only resumes are not supported — export a text-based PDF.',
    );
  }

  return normalized.slice(0, MAX_EXTRACTED_CHARS);
}
