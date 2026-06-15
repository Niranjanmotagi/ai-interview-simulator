'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  Bot,
  Minus,
  Plus,
  ShieldCheck,
  SquareTerminal,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };

const STEPS = [
  { n: '01', title: 'Open a room', body: 'Spin up an interview room, pick a language, and you are the interviewer. No setup, no installs.' },
  { n: '02', title: 'Send the link', body: 'Your candidate joins from any browser — instantly synced into the same editor.' },
  { n: '03', title: 'Pair, run, evaluate', body: 'Write code together with live cursors, run it in a sandbox, and let the AI assist and grade.' },
];

const FEATURES = [
  { icon: Users, k: 'collab', title: 'Real-time collaboration', body: 'Multiple cursors, presence and typing on a shared CRDT document — Docs-smooth, for code.' },
  { icon: ShieldCheck, k: 'sandbox', title: 'Isolated execution', body: 'Run 5 languages in a sandbox with CPU, memory and time limits. No network. No filesystem.' },
  { icon: Bot, k: 'ai', title: 'AI assistant', body: 'Generate problems and hints, then grade correctness, complexity and code quality.' },
  { icon: Activity, k: 'signals', title: 'Integrity signals', body: 'Paste, tab-switch and blur tracking, distilled into a live focus score for the interviewer.' },
  { icon: Video, k: 'replay', title: 'Recording & replay', body: 'Every snapshot, message and run captured — replay the session like a commit history.' },
  { icon: SquareTerminal, k: 'editor', title: 'Real editor', body: 'Monaco with syntax, autocomplete and theming across Java, Python, JS, C++ and Go.' },
];

const MARQUEE = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'C++', 'GO', 'LIVE CURSORS', 'SANDBOXED', 'AI EVAL', 'REPLAY'];

const FAQS = [
  { q: 'Do candidates install anything?', a: 'No. They open the invite link in any modern browser and start coding immediately.' },
  { q: 'How is code executed safely?', a: 'In an isolate sandbox with strict CPU, wall-clock and memory limits and no network or filesystem access. The platform never runs code on its own host.' },
  { q: 'Which languages are supported?', a: 'Java, Python, JavaScript, C++ and Go — each with full Monaco editing.' },
  { q: 'What does the AI do?', a: 'Generates problems and follow-ups, gives non-spoiler hints, explains solutions, and produces a structured evaluation report.' },
  { q: 'Can we review afterwards?', a: 'Yes — code snapshots, chat and execution history are saved so you can replay and share the session.' },
];

export default function CodesyncLandingPage() {
  const { status } = useAuth();
  const startHref = status === 'authenticated' ? '/rooms' : '/login';
  return (
    <div className="bg-[#0a0a0b]">
      <Nav status={status} />
      <Hero startHref={startHref} />
      <Marquee />
      <HowItWorks />
      <Features />
      <Faq />
      <FooterCta startHref={startHref} />
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/codesync" className="group flex items-center gap-2.5">
      <span className="grid h-6 w-6 place-items-center rounded-[5px] bg-lime-300 text-black">
        <SquareTerminal className="h-3.5 w-3.5" />
      </span>
      <span className="font-display text-[15px] font-semibold tracking-tight text-white">CodeSync</span>
      <span className="font-mono text-[11px] text-lime-300">[AI]</span>
    </Link>
  );
}

function Nav({ status }: { status: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wider text-zinc-500 md:flex">
          <a href="#how" className="transition-colors hover:text-zinc-100">how</a>
          <a href="#features" className="transition-colors hover:text-zinc-100">features</a>
          <a href="#faq" className="transition-colors hover:text-zinc-100">faq</a>
        </nav>
        <div className="flex items-center gap-4">
          {status !== 'authenticated' && (
            <Link href="/login" className="hidden font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white sm:block">
              sign in
            </Link>
          )}
          <Link
            href={status === 'authenticated' ? '/rooms' : '/login'}
            className="rounded-md bg-lime-300 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-200"
          >
            {status === 'authenticated' ? 'Dashboard' : 'Start interview'}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ startHref }: { startHref: string }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="bg-grid-fade absolute inset-0 bg-blueprint" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-lime-300">// real-time coding interviews</p>
          <h1 className="mt-5 font-display text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.02em] text-white sm:text-[4.25rem]">
            Interviews that feel like{' '}
            <span className="relative whitespace-nowrap text-lime-300">
              pair&nbsp;programming
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" preserveAspectRatio="none">
                <path d="M1 4 Q 150 0 299 4" stroke="#bef264" strokeWidth="2" fill="none" />
              </svg>
            </span>
            .
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
            One focused room: a shared editor with live cursors, sandboxed execution, chat, and an
            AI assistant that hints and grades. Built for real technical interviews.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={startHref}
              className="group inline-flex items-center gap-2 rounded-md bg-lime-300 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-200"
            >
              Start an interview
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-5 py-3 font-mono text-xs uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/30 hover:text-white">
              how it works
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-zinc-600">
            <span>5 languages</span>
            <span className="text-zinc-700">/</span>
            <span>&lt;100ms sync</span>
            <span className="text-zinc-700">/</span>
            <span>isolate sandbox</span>
            <span className="text-zinc-700">/</span>
            <span>ai evaluation</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease }}>
          <EditorMock />
        </motion.div>
      </div>
    </section>
  );
}

function EditorMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0d11]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-[11px] text-zinc-500">two_sum.py</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-lime-300">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> live
        </span>
      </div>
      <pre className="overflow-hidden px-4 py-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>{`def two_sum(nums, target):
    seen = {}
    for i, n `}<span className="relative rounded-sm bg-lime-300/15">in enumerate(nums)<span className="absolute -top-5 left-0 whitespace-nowrap rounded-sm bg-lime-300 px-1.5 py-0.5 text-[10px] font-semibold text-black">Niranjan</span></span>{`:
        if target - n in seen:
            return [seen[target-n], i]
        seen[n] = i`}<span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-sky-400 align-middle" /></code>
      </pre>
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 font-mono text-[11px]">
        <span className="text-zinc-600">$</span>
        <span className="text-lime-300">✓ [0, 1]</span>
        <span className="text-zinc-600">· 41ms · 4.0 MB</span>
      </div>
    </div>
  );
}

function Marquee() {
  return (
    <div className="overflow-hidden border-b border-white/10 py-4">
      <div className="flex w-max animate-marquee-slow gap-8 font-mono text-sm uppercase tracking-[0.2em] text-zinc-700">
        {[...MARQUEE, ...MARQUEE].map((m, i) => (
          <span key={i} className="flex items-center gap-8">
            {m}
            <span className="text-lime-300/50">+</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
      <span className="text-lime-300">[ {index} ]</span> {label}
    </p>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
        <SectionLabel index="01" label="how it works" />
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Link to live coding in seconds.
        </h2>
        <div className="mt-14">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t border-white/10 py-8 transition-colors hover:bg-white/[0.015] sm:grid-cols-[140px_1fr] sm:gap-12"
            >
              <span className="font-display text-4xl font-semibold tracking-tight text-lime-300 sm:text-6xl">{s.n}</span>
              <div className="max-w-xl">
                <h3 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">{s.title}</h3>
                <p className="mt-2 text-zinc-400">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
        <SectionLabel index="02" label="capabilities" />
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          One room. Everything you need.
        </h2>
        {/* Schematic grid — connected hairline cells, not floaty cards. */}
        <div className="mt-14 grid grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.k} className="group relative border-b border-r border-white/10 p-6 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-zinc-400 transition-colors group-hover:border-lime-300/40 group-hover:text-lime-300">
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-700 transition-colors group-hover:text-lime-300/60">/{f.k}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-white/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[320px_1fr]">
        <div>
          <SectionLabel index="03" label="faq" />
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Questions,<br />answered.</h2>
        </div>
        <div>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-t border-white/10">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="font-medium text-white">{item.q}</span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-white/10 text-lime-300">
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {isOpen && <p className="-mt-1 pb-5 pr-8 text-sm leading-relaxed text-zinc-400">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FooterCta({ startHref }: { startHref: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid-fade absolute inset-0 bg-blueprint" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-lime-300">// ready when you are</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Run your next interview here.
          </h2>
        </div>
        <Link href={startHref} className="group inline-flex items-center gap-2 rounded-md bg-lime-300 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-200">
          Start an interview
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 font-mono text-xs text-zinc-600 sm:px-6">
          <Wordmark />
          <span className="uppercase tracking-wider">collaborative coding interviews</span>
        </div>
      </div>
    </section>
  );
}
