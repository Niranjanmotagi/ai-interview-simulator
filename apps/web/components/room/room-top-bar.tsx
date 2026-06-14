'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, Code2, Copy, DoorOpen, LogOut } from 'lucide-react';
import type { RoomDto, RoomLanguage, RoomRole } from '@ai-interview/types';
import { ROOM_LANGUAGES } from '@ai-interview/types';
import { LANGUAGE_LABELS } from '@/lib/codesync';
import type { RoomConnectionStatus } from '@/lib/use-room';

const STATUS: Record<RoomConnectionStatus, { label: string; color: string }> = {
  connecting: { label: 'Connecting', color: '#f59e0b' },
  connected: { label: 'Live', color: '#22c55e' },
  reconnecting: { label: 'Reconnecting', color: '#f59e0b' },
  error: { label: 'Disconnected', color: '#ef4444' },
  ended: { label: 'Ended', color: '#a3a3a3' },
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

export function RoomTopBar({ room, language, yourRole, status, onChangeLanguage, onSnapshot, onEnd }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const isInterviewer = yourRole === 'interviewer';
  const s = STATUS[status];

  function copyInvite() {
    if (!room) {
      return;
    }
    const link = `${window.location.origin}/rooms/join/${room.inviteCode}`;
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 backdrop-blur-xl sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Code2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="hidden font-display text-sm font-semibold tracking-tight text-white sm:inline">
          CodeSync
        </span>
        <span className="hidden h-4 w-px bg-white/15 sm:block" />
        <h1 className="min-w-0 truncate text-sm text-white/70">{room?.title ?? 'Loading…'}</h1>

        <span
          className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2 py-1 text-xs font-medium text-white/70 sm:px-2.5"
          title={s.label}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'animate-pulse-soft' : ''}`}
            style={{ background: s.color }}
          />
          <span className="hidden sm:inline">{s.label}</span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <select
          value={language}
          onChange={(e) => onChangeLanguage(e.target.value as RoomLanguage)}
          disabled={!isInterviewer}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/80 outline-none transition-colors hover:bg-white/[0.07] focus:border-sky-500/50 disabled:opacity-60 sm:px-2.5"
          title={isInterviewer ? 'Change language' : 'Only the interviewer can change the language'}
        >
          {ROOM_LANGUAGES.map((l) => (
            <option key={l} value={l} className="bg-[#111]">
              {LANGUAGE_LABELS[l]}
            </option>
          ))}
        </select>

        {room && (
          <button
            type="button"
            onClick={copyInvite}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/[0.07] sm:px-2.5"
            title="Copy invite link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden font-mono md:inline">{room.inviteCode}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSnapshot}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/[0.07] sm:px-2.5"
          title="Save a code snapshot"
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Snapshot</span>
        </button>

        {isInterviewer ? (
          <button
            type="button"
            onClick={onEnd}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/90 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 sm:px-2.5"
            title="End interview"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/[0.07] sm:px-2.5"
            title="Leave room"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </header>
  );
}
