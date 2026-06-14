'use client';

import { Circle } from 'lucide-react';
import type { PresenceUser } from '@ai-interview/types';
import type { TypingUser } from '@/lib/use-room';

const ROLE_LABEL: Record<string, string> = {
  interviewer: 'Interviewer',
  candidate: 'Candidate',
  observer: 'Observer',
};

interface Props {
  presence: PresenceUser[];
  typingUsers: TypingUser[];
  selfSocketId: string | null;
}

export function ParticipantsPanel({ presence, typingUsers, selfSocketId }: Props) {
  const selfUserId = presence.find((p) => p.socketId === selfSocketId)?.userId;
  // One row per user even if they have multiple tabs open.
  const unique = Array.from(new Map(presence.map((p) => [p.userId, p])).values());
  const typingNames = new Set(typingUsers.map((t) => t.name));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">Participants</h2>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Circle className="h-2 w-2 fill-emerald-400" />
          {unique.length} online
        </span>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-2">
        {unique.map((p) => {
          const isYou = p.userId === selfUserId;
          const isTyping = typingNames.has(p.name) && !isYou;
          return (
            <li
              key={p.userId}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.04]"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#0A0A0A]"
                style={{ background: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">
                  {p.name}
                  {isYou && <span className="ml-1.5 text-xs text-white/40">(you)</span>}
                </p>
                <p className="text-xs text-white/40">
                  {isTyping ? (
                    <span className="text-sky-400">typing…</span>
                  ) : (
                    ROLE_LABEL[p.role] ?? p.role
                  )}
                </p>
              </div>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
            </li>
          );
        })}
        {unique.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-white/30">Waiting for participants…</li>
        )}
      </ul>
    </div>
  );
}
