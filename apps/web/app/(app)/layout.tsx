'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Client-side auth gate. The middleware handles the fast redirect via the
 * hint cookie; this gate handles the authoritative check (silent refresh
 * against the API) and bounces stale sessions.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-60 border-r p-4 lg:block">
          <Skeleton className="h-8 w-40" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-64" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
