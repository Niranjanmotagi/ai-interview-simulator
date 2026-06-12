import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/resumes',
  '/interviews',
  '/reports',
  '/settings',
];
const AUTH_PAGES = ['/login', '/register'];

/**
 * UX-level guard only: redirects based on a non-sensitive hint cookie.
 * Real authorization is enforced by the API on every request — a forged
 * hint cookie gets you an empty shell and 401s, nothing more.
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has('aiis_session');

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/resumes/:path*', '/interviews/:path*', '/reports/:path*', '/settings/:path*', '/login', '/register'],
};
