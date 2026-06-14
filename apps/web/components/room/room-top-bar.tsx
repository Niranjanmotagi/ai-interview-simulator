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
  connected: { label: 'Live', color: '#4f46e5' },
  reconnecting: { label: 'Reconnecting', color: '#f59e0b' },
  error: { label: 'Disconnected', color: '#ef4444' },
  ended: { label: 'Ended', color: '#a1a1aa' },
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
  'flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 sm:px-2.5';

export function RoomTopBar({ room, language, yourRole, status, onChangeLanguage, onSnapshot, onEnd }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const isInterviewer = yourRole === 'interviewer';
  const s = STATUS[status];

  function copyInvite() {
    if (!room) {
      return;
    }
    void navigator.clipboard.writeText(`${window.location.origin}/rooms/join/${room.inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Code2 className="h-4 w-4 shrink-0 text-indigo-600" />
        <span className="hidden font-display text-sm font-semibold tracking-tight text-zinc-900 sm:inline">
          CodeSync
        </span>
        <span className="hidden h-4 w-px bg-zinc-200 sm:block" />
        <h1 className="min-w-0 truncate text-sm text-zinc-600">{room?.title ?? 'Loading…'}</h1>

        <span
          className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 sm:px-2.5"
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
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none transition-colors hover:bg-zinc-50 focus:border-indigo-500 disabled:opacity-60 sm:px-2.5"
          title={isInterviewer ? 'Change language' : 'Only the interviewer can change the language'}
        >
          {ROOM_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_LABELS[l]}
            </option>
          ))}
        </select>

        {room && (
          <button type="button" onClick={copyInvite} className={btn} title="Copy invite link">
            {copied ? <Check className="h-3.5 w-3.5 text-indigo-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden font-mono md:inline">{room.inviteCode}</span>
          </button>
        )}

        <button type="button" onClick={onSnapshot} className={btn} title="Save a code snapshot">
          <Camera className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Snapshot</span>
        </button>

        {isInterviewer ? (
          <button
            type="button"
            onClick={onEnd}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 sm:px-2.5"
            title="End interview"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End</span>
          </button>
        ) : (
          <button type="button" onClick={() => router.push('/rooms')} className={btn} title="Leave room">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </header>
  );
}
