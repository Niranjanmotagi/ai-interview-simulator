'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { CinematicBackground } from '@/components/room/cinematic-background';

/**
 * CodeSync's own dark, cinematic surface — independent of the light app shell.
 * Client-side auth gate; the API enforces real authorization on every call.
 */
export default function CodesyncLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <div className="relative min-h-screen font-sans text-white">
      <CinematicBackground dim={0.58} />
      {status === 'authenticated' ? (
        children
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      )}
    </div>
  );
}
