'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { joinRoom } from '@/lib/codesync';
import { ApiClientError } from '@/lib/api';

/** Entry point for shared invite links: join by code, then enter the room. */
export default function JoinByCodePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) {
      return;
    }
    attempted.current = true;
    joinRoom(params.code)
      .then((room) => router.replace(`/rooms/${room.id}`))
      .catch((e) =>
        setError(e instanceof ApiClientError ? e.message : 'Could not join this room.'),
      );
  }, [params.code, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {error ? (
        <>
          <p className="text-white/60">{error}</p>
          <Link href="/rooms" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
            Back to rooms
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          <p className="text-sm text-white/50">Joining room…</p>
        </>
      )}
    </div>
  );
}
