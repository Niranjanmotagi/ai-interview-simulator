/**
 * Operational error type carried through the middleware chain.
 * `code` is a stable, machine-readable string the frontend can branch on;
 * `status` is the HTTP status; `details` carries field-level info (e.g. zod issues).
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational = true;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }
  static notFound(resource = 'Resource') {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }
  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }
  static unprocessable(message: string, details?: Record<string, unknown>) {
    return new ApiError(422, 'UNPROCESSABLE', message, details);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL', message);
  }
  static serviceUnavailable(message = 'Service temporarily unavailable', code = 'AI_UNAVAILABLE') {
    return new ApiError(503, code, message);
  }
}
