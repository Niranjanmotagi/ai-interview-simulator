'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, Copy, DoorOpen, LogOut, SquareTerminal } from 'lucide-react';
import type { RoomDto, RoomLanguage, RoomRole } from '@ai-interview/types';
import { ROOM_LANGUAGES } from '@ai-interview/types';
import { LANGUAGE_LABELS } from '@/lib/codesync';
import type { RoomConnectionStatus } from '@/lib/use-room';

const STATUS: Record<RoomConnectionStatus, { label: string; color: string }> = {
  connecting: { label: 'connecting', color: '#f59e0b' },
  connected: { label: 'live', color: '#bef264' },
  reconnecting: { label: 'reconnecting', color: '#f59e0b' },
  error: { label: 'offline', color: '#ef4444' },
  ended: { label: 'ended', color: '#71717a' },
};

interface Props {
  room: RoomDto | null;
  language: RoomLanguage;
  yourRole: RoomRole;
  status: RoomConnectionStatus;
  onChangeLanguage: (lang: RoomLanguage) => void;
  onSnapshot: () => void;
  onEnd: () => void;
}

const btn =
  'flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-xs text-zinc-300 transition-colors hover:border-lime-300/40 hover:text-white sm:px-2.5';

export function RoomTopBar({ room, language, yourRole, status, onChangeLanguage, onSnapshot, onEnd }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const isInterviewer = yourRole === 'interviewer';
  const s = STATUS[status];

  function copyInvite() {
    if (!room) return;
    void navigator.clipboard.writeText(`${window.location.origin}/rooms/join/${room.inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-[#0a0a0b] px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] bg-lime-300 text-black">
          <SquareTerminal className="h-3.5 w-3.5" />
        </span>
        <h1 className="min-w-0 truncate text-sm text-zinc-300">{room?.title ?? 'Loading…'}</h1>
        <span className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-zinc-400 sm:px-2.5" title={s.label}>
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'animate-pulse-soft' : ''}`} style={{ background: s.color }} />
          <span className="hidden sm:inline">{s.label}</span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <select
          value={language}
          onChange={(e) => onChangeLanguage(e.target.value as RoomLanguage)}
          disabled={!isInterviewer}
          className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-xs uppercase tracking-wider text-zinc-300 outline-none transition-colors hover:border-lime-300/40 focus:border-lime-300/50 disabled:opacity-60 sm:px-2.5"
          title={isInterviewer ? 'Change language' : 'Only the interviewer can change the language'}
        >
          {ROOM_LANGUAGES.map((l) => (
            <option key={l} value={l} className="bg-[#111]">{LANGUAGE_LABELS[l]}</option>
          ))}
        </select>

        {room && (
          <button type="button" onClick={copyInvite} className={btn} title="Copy invite link">
            {copied ? <Check className="h-3.5 w-3.5 text-lime-300" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{room.inviteCode}</span>
          </button>
        )}

        <button type="button" onClick={onSnapshot} className={btn} title="Save a code snapshot">
          <Camera className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">snapshot</span>
        </button>

        {isInterviewer ? (
          <button type="button" onClick={onEnd} className="flex items-center gap-1.5 rounded-md bg-red-500/90 px-2 py-1.5 font-mono text-xs text-white transition-colors hover:bg-red-500 sm:px-2.5" title="End interview">
            <DoorOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">end</span>
          </button>
        ) : (
          <button type="button" onClick={() => router.push('/rooms')} className={btn} title="Leave room">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">leave</span>
          </button>
        )}
      </div>
    </header>
  );
}
