'use client';

import type { ApiResponse, AuthResponse } from '@ai-interview/types';

/**
 * API client. Access token lives in memory only (never localStorage — XSS
 * cannot exfiltrate what is not stored). The httpOnly refresh cookie rides
 * along automatically; on a 401 the client refreshes once and retries.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  retried?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    // Non-JSON response (proxy error page etc.)
  }

  if (res.ok && payload?.success) {
    return payload.data;
  }

  const code = payload && !payload.success ? payload.error.code : 'UNKNOWN';
  const message =
    payload && !payload.success ? payload.error.message : `Request failed (${res.status})`;
  const details = payload && !payload.success ? payload.error.details : undefined;

  // Expired access token → one silent refresh, then retry the original call.
  if (
    res.status === 401 &&
    !options.retried &&
    !path.startsWith('/auth/') &&
    (code === 'TOKEN_EXPIRED' || code === 'TOKEN_MISSING' || code === 'TOKEN_INVALID')
  ) {
    const session = await refreshSession();
    if (session) {
      return api<T>(path, { ...options, retried: true });
    }
  }

  throw new ApiClientError(code, message, res.status, details);
}

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
export async function refreshSession(): Promise<AuthResponse | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        const payload = (await res.json()) as ApiResponse<AuthResponse>;
        if (res.ok && payload.success) {
          accessToken = payload.data.accessToken;
          return payload.data;
        }
        accessToken = null;
        return null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/**
 * Lightweight, non-sensitive hint cookie on the frontend origin so Next.js
 * middleware can redirect unauthenticated visitors without seeing the real
 * (httpOnly) refresh token. Auth itself is enforced by the API.
 */
export const SESSION_HINT_COOKIE = 'aiis_session';

export function setSessionHint(on: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = on
    ? `${SESSION_HINT_COOKIE}=1; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`
    : `${SESSION_HINT_COOKIE}=; path=/; max-age=0`;
}
