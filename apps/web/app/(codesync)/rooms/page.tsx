'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowUpRight, Loader2, Plus, SquareTerminal, Users } from 'lucide-react';
import { ROOM_LANGUAGES, type RoomLanguage, type RoomStatus } from '@ai-interview/types';
import { createRoom, joinRoom, LANGUAGE_LABELS, listRooms } from '@/lib/codesync';
import { ApiClientError } from '@/lib/api';

const ease = [0.16, 1, 0.3, 1] as const;
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } };

const STATUS_META: Record<RoomStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
  scheduled: { label: 'scheduled', dot: '#f59e0b', text: 'text-amber-400', pulse: false },
  active: { label: 'live', dot: '#bef264', text: 'text-lime-300', pulse: true },
  ended: { label: 'ended', dot: '#52525b', text: 'text-zinc-500', pulse: false },
};

const inputCls =
  'w-full rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-lime-300/50 focus:outline-none focus:ring-1 focus:ring-lime-300/30';

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
    <div className="min-h-screen bg-[#0a0a0b]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/codesync" className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-[5px] bg-lime-300 text-black">
              <SquareTerminal className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-white">CodeSync</span>
            <span className="font-mono text-[11px] text-lime-300">[AI]</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
              <span className="text-lime-300">[ dashboard ]</span> your rooms
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Live coding rooms</h1>
          </motion.div>

          {/* Create + join */}
          <motion.div variants={item} className="mb-12 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 lg:col-span-2">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-500">// new interview</h2>
              <div className="flex flex-col gap-3">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Interview title (e.g. Backend — Trees & Graphs)" className={inputCls} />
                <div className="flex gap-3">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as RoomLanguage)}
                    className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-zinc-300 focus:border-lime-300/50 focus:outline-none sm:flex-none"
                  >
                    {ROOM_LANGUAGES.map((l) => (
                      <option key={l} value={l} className="bg-[#111]">{LANGUAGE_LABELS[l]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => create.mutate()}
                    disabled={create.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-lime-300 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-200 disabled:opacity-50 sm:flex-none"
                  >
                    {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create room
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-500">// join with code</h2>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinCode.trim().length >= 4 && join.mutate()}
                  placeholder="7KQ2MX9P"
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm uppercase tracking-[0.2em] text-white placeholder:tracking-normal placeholder:text-zinc-600 focus:border-lime-300/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => join.mutate()}
                  disabled={join.isPending || joinCode.trim().length < 4}
                  className="flex shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white transition-colors hover:border-lime-300/40 disabled:opacity-40"
                  aria-label="Join room"
                >
                  {join.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          <motion.h2 variants={item} className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-600">// rooms</motion.h2>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/[0.02]" />
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
                      className="group block rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:-translate-y-0.5 hover:border-lime-300/40 hover:bg-white/[0.04]"
                    >
                      <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
                        <span className={`inline-flex items-center gap-1.5 ${meta.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.pulse ? 'animate-pulse-soft' : ''}`} style={{ background: meta.dot }} />
                          {meta.label}
                        </span>
                        <span className="text-zinc-600">{LANGUAGE_LABELS[room.language]}</span>
                      </div>
                      <h3 className="truncate font-display text-base font-semibold tracking-tight text-white">{room.title}</h3>
                      <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {room.participantCount} · {room.yourRole}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-600 transition-colors group-hover:text-lime-300">
                          enter <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div variants={item} className="rounded-xl border border-dashed border-white/15 bg-white/[0.01] py-16 text-center font-mono text-sm text-zinc-600">
              no rooms yet — create your first interview above.
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
