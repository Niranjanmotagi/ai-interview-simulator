'use client';

import { Circle } from 'lucide-react';
import type { PresenceUser } from '@ai-interview/types';
import type { TypingUser } from '@/lib/use-room';

const ROLE_LABEL: Record<string, string> = {
  interviewer: 'interviewer',
  candidate: 'candidate',
  observer: 'observer',
};

interface Props {
  presence: PresenceUser[];
  typingUsers: TypingUser[];
  selfSocketId: string | null;
}

export function ParticipantsPanel({ presence, typingUsers, selfSocketId }: Props) {
  const selfUserId = presence.find((p) => p.socketId === selfSocketId)?.userId;
  const unique = Array.from(new Map(presence.map((p) => [p.userId, p])).values());
  const typingNames = new Set(typingUsers.map((t) => t.name));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">// participants</h2>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-lime-300">
          <Circle className="h-2 w-2 fill-lime-300" />
          {unique.length}
        </span>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {unique.map((p) => {
          const isYou = p.userId === selfUserId;
          const isTyping = typingNames.has(p.name) && !isYou;
          return (
            <li key={p.userId} className="flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-white/[0.03]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-black" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {p.name}
                  {isYou && <span className="ml-1.5 font-mono text-[10px] text-zinc-500">you</span>}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {isTyping ? <span className="text-lime-300">typing…</span> : ROLE_LABEL[p.role] ?? p.role}
                </p>
              </div>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
            </li>
          );
        })}
        {unique.length === 0 && (
          <li className="px-3 py-6 text-center font-mono text-xs text-zinc-600">waiting for participants…</li>
        )}
      </ul>
    </div>
  );
}
