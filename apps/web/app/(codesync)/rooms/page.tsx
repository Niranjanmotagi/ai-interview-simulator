'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  Bot,
  Code2,
  Loader2,
  Plus,
  ShieldCheck,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { ROOM_LANGUAGES, type RoomLanguage, type RoomStatus } from '@ai-interview/types';
import { createRoom, joinRoom, LANGUAGE_LABELS, listRooms } from '@/lib/codesync';
import { ApiClientError } from '@/lib/api';
import { AuroraGlow } from '@/components/room/aurora-glow';

const STATUS_META: Record<RoomStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
  scheduled: { label: 'Scheduled', dot: '#f59e0b', text: 'text-amber-300', pulse: false },
  active: { label: 'Live', dot: '#22c55e', text: 'text-emerald-300', pulse: true },
  ended: { label: 'Ended', dot: '#71717a', text: 'text-white/40', pulse: false },
};

const LANG_DOT: Record<RoomLanguage, string> = {
  javascript: '#f7df1e',
  python: '#3b82f6',
  java: '#f89820',
  cpp: '#9333ea',
  go: '#22d3ee',
};

const FEATURES = [
  { icon: Zap, label: 'Real-time sync' },
  { icon: Bot, label: 'AI-assisted' },
  { icon: ShieldCheck, label: 'Sandboxed execution' },
  { icon: Video, label: 'Recorded & replayable' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function RoomsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<RoomLanguage>('javascript');
  const [joinCode, setJoinCode] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['rooms'], queryFn: () => listRooms(1, 30) });

  const create = useMutation({
    mutationFn: () => createRoom({ title: title.trim() || 'Untitled interview', language }),
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      router.push(`/rooms/${room.id}`);
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Could not create room'),
  });

  const join = useMutation({
    mutationFn: () => joinRoom(joinCode.trim()),
    onSuccess: (room) => router.push(`/rooms/${room.id}`),
    onError: (e) =>
      toast.error(e instanceof ApiClientError ? e.message : 'Could not join — check the code'),
  });

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <AuroraGlow />

      <motion.div variants={container} initial="hidden" animate="show">
        {/* Hero */}
        <motion.header variants={item} className="mb-8 sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 backdrop-blur-xl">
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            CodeSync
          </div>
          <h1 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Live coding rooms,
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              the calm way to interview.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/50 sm:text-base">
            Create a room, share the link, and collaborate in real time — shared editor, live
            cursors, chat, and AI assistance.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60"
              >
                <f.icon className="h-3.5 w-3.5 text-white/40" />
                {f.label}
              </span>
            ))}
          </div>
        </motion.header>

        {/* Create + join */}
        <motion.div variants={item} className="mb-12 grid gap-4 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl lg:col-span-2">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-60" />
            <h2 className="mb-4 text-sm font-semibold text-white/80">Start a new interview</h2>
            <div className="flex flex-col gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Interview title (e.g. Backend — Trees & Graphs)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="flex gap-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as RoomLanguage)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 focus:border-emerald-500/50 focus:outline-none sm:flex-none"
                >
                  {ROOM_LANGUAGES.map((l) => (
                    <option key={l} value={l} className="bg-[#111]">
                      {LANGUAGE_LABELS[l]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#06140c] shadow-[0_0_24px_-6px_rgba(34,197,94,0.6)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_-4px_rgba(34,197,94,0.75)] disabled:opacity-50 sm:flex-none"
                >
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create room
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-semibold text-white/80">Join with a code</h2>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinCode.trim().length >= 4 && join.mutate()}
                placeholder="7KQ2MX9P"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-mono text-sm uppercase tracking-[0.2em] text-white placeholder:tracking-normal placeholder:text-white/30 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={() => join.mutate()}
                disabled={join.isPending || joinCode.trim().length < 4}
                className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-40"
                aria-label="Join room"
              >
                {join.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Room list */}
        <motion.h2 variants={item} className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">
          Your rooms
        </motion.h2>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <motion.div variants={container} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((room) => {
              const meta = STATUS_META[room.status];
              return (
                <motion.div key={room.id} variants={item}>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.pulse ? 'animate-pulse-soft' : ''}`}
                          style={{ background: meta.dot }}
                        />
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                        <span className="h-2 w-2 rounded-full" style={{ background: LANG_DOT[room.language] }} />
                        {LANGUAGE_LABELS[room.language]}
                      </span>
                    </div>
                    <h3 className="truncate text-base font-medium text-white/90 group-hover:text-white">
                      {room.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {room.participantCount} · <span className="capitalize">{room.yourRole}</span>
                      </span>
                      <span className="flex items-center gap-1 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-300">
                        Enter <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            variants={item}
            className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center"
          >
            <p className="text-white/40">No rooms yet. Create your first interview above.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
