'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Code2, Loader2, Plus, Users } from 'lucide-react';
import { ROOM_LANGUAGES, type RoomLanguage, type RoomStatus } from '@ai-interview/types';
import { createRoom, joinRoom, LANGUAGE_LABELS, listRooms } from '@/lib/codesync';
import { ApiClientError } from '@/lib/api';

const STATUS_META: Record<RoomStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
  scheduled: { label: 'Scheduled', dot: '#f59e0b', text: 'text-amber-600', pulse: false },
  active: { label: 'Live', dot: '#4f46e5', text: 'text-indigo-600', pulse: true },
  ended: { label: 'Ended', dot: '#a1a1aa', text: 'text-zinc-400', pulse: false },
};

const LANG_DOT: Record<RoomLanguage, string> = {
  javascript: '#eab308',
  python: '#3b82f6',
  java: '#ea580c',
  cpp: '#9333ea',
  go: '#0891b2',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
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
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Could not join — check the code'),
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/codesync" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <Code2 className="h-5 w-5 text-indigo-600" />
            CodeSync<span className="text-indigo-600">AI</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Dashboard</span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Live coding rooms
            </h1>
            <p className="mt-2 max-w-xl text-zinc-500">
              Create a room as the interviewer, share the link, and collaborate in real time.
            </p>
          </motion.div>

          {/* Create + join */}
          <motion.div variants={item} className="mb-12 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">Start a new interview</h2>
              <div className="flex flex-col gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Interview title (e.g. Backend — Trees & Graphs)"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex gap-3">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as RoomLanguage)}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus:border-indigo-500 focus:outline-none sm:flex-none"
                  >
                    {ROOM_LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {LANGUAGE_LABELS[l]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => create.mutate()}
                    disabled={create.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 sm:flex-none"
                  >
                    {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create room
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">Join with a code</h2>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinCode.trim().length >= 4 && join.mutate()}
                  placeholder="7KQ2MX9P"
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase tracking-[0.2em] text-zinc-900 placeholder:tracking-normal placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => join.mutate()}
                  disabled={join.isPending || joinCode.trim().length < 4}
                  className="flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
                  aria-label="Join room"
                >
                  {join.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Room list */}
          <motion.h2 variants={item} className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Your rooms
          </motion.h2>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
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
                      className="group block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-zinc-900/5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${meta.pulse ? 'animate-pulse-soft' : ''}`}
                            style={{ background: meta.dot }}
                          />
                          {meta.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="h-2 w-2 rounded-full" style={{ background: LANG_DOT[room.language] }} />
                          {LANGUAGE_LABELS[room.language]}
                        </span>
                      </div>
                      <h3 className="truncate font-display text-base font-semibold tracking-tight text-zinc-900">
                        {room.title}
                      </h3>
                      <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {room.participantCount} · <span className="capitalize">{room.yourRole}</span>
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-600">
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
              className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center"
            >
              <p className="text-zinc-400">No rooms yet. Create your first interview above.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
