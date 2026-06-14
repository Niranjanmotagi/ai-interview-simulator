'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bot,
  Code2,
  Languages,
  Minus,
  Plus,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const STEPS = [
  { n: '01', title: 'Create a room', body: 'Spin up an interview room in a click, pick a language, and you become the interviewer.' },
  { n: '02', title: 'Share the link', body: 'Send the invite link. Your candidate joins instantly — no installs, no accounts to wrangle.' },
  { n: '03', title: 'Collaborate live', body: 'Write code together with live cursors, run it in a sandbox, chat, and let AI assist and evaluate.' },
];

const FEATURES = [
  { icon: Users, title: 'Real-time collaboration', body: 'Multiple cursors, presence, and typing indicators on a shared CRDT document — Google-Docs-smooth for code.' },
  { icon: ShieldCheck, title: 'Secure execution', body: 'Run Java, Python, JavaScript, C++ and Go in an isolated sandbox with CPU, memory and time limits — no network or filesystem.' },
  { icon: Bot, title: 'AI assistant', body: 'Generate questions and hints, then get an AI evaluation of correctness, complexity and code quality.' },
  { icon: Activity, title: 'Activity monitoring', body: 'Track copy/paste, tab switches and window blur, with a derived focus score for the interviewer.' },
  { icon: Video, title: 'Recording & replay', body: 'Every snapshot, message and run is captured — replay the whole session like a series of commits.' },
  { icon: Languages, title: 'Five languages', body: 'First-class Monaco editing with syntax, autocomplete and theming across all supported languages.' },
];

const FAQS = [
  { q: 'Do candidates need to install anything?', a: 'No. They open the invite link in any modern browser and start coding immediately.' },
  { q: 'How is code executed safely?', a: 'Code runs in an isolated sandbox (isolate) with strict CPU, wall-clock and memory limits and no network or filesystem access — the platform never runs code on its own host.' },
  { q: 'Which languages are supported?', a: 'Java, Python, JavaScript, C++ and Go, each with full Monaco editing.' },
  { q: 'What does the AI actually do?', a: 'It can generate coding questions and follow-ups, offer hints, explain solutions, and produce a structured evaluation report after the session.' },
  { q: 'Can we review an interview afterwards?', a: 'Yes. Code snapshots, chat logs and execution history are saved so you can replay and share the session.' },
];

export default function CodesyncLandingPage() {
  const { status } = useAuth();
  const startHref = status === 'authenticated' ? '/rooms' : '/login';

  return (
    <div className="bg-white">
      <Nav status={status} />
      <Hero startHref={startHref} />
      <HowItWorks />
      <Features />
      <Faq />
      <FooterCta startHref={startHref} />
    </div>
  );
}

function Nav({ status }: { status: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/codesync" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Code2 className="h-5 w-5 text-indigo-600" />
          CodeSync
          <span className="text-indigo-600">AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-500 md:flex">
          <a href="#features" className="transition-colors hover:text-zinc-900">Features</a>
          <a href="#how" className="transition-colors hover:text-zinc-900">How it works</a>
          <a href="#faq" className="transition-colors hover:text-zinc-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          {status !== 'authenticated' && (
            <Link href="/login" className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 sm:block">
              Sign in
            </Link>
          )}
          <Link
            href={status === 'authenticated' ? '/rooms' : '/login'}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
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
    <section className="relative overflow-hidden bg-[#0d0d10] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-indigo-600/25 blur-[140px]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            AI-powered interviews
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Conduct better technical interviews.
            <br />
            <span className="text-indigo-400">Powered by AI.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">
            A real-time collaborative coding room with live cursors, sandboxed execution, chat, and
            an AI assistant — everything you need to run a great interview, in the browser.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={startHref}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Start interview <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <EditorMock />
        </motion.div>
      </div>
    </section>
  );
}

/** Stylized product preview — a mini collaborative editor with live cursors. */
function EditorMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0d11] shadow-2xl shadow-indigo-950/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-white/40">two-sum.py · Live</span>
        <span className="ml-auto flex -space-x-2">
          <span className="h-6 w-6 rounded-full border-2 border-[#0c0d11] bg-indigo-500" />
          <span className="h-6 w-6 rounded-full border-2 border-[#0c0d11] bg-emerald-500" />
        </span>
      </div>
      <pre className="overflow-hidden px-4 py-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>{`def two_sum(nums, target):
    seen = {}
    for i, n `}<span className="relative rounded bg-indigo-500/20 px-0.5">in enumerate(nums)<span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Niranjan</span></span>{`:
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`}<span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-emerald-400 align-middle" /></code>
      </pre>
      <div className="border-t border-white/10 px-4 py-2.5">
        <p className="text-[11px] font-medium text-emerald-400">✓ Ran in 41ms · [0, 1]</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">How it works</span>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          From link to live coding in seconds.
        </h2>

        <div className="mt-14 space-y-px">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-[auto_1fr] items-start gap-6 border-t border-zinc-200 py-8 sm:grid-cols-[120px_1fr] sm:gap-10"
            >
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-semibold tracking-tight text-indigo-600 sm:text-4xl">
                  {s.n}
                </span>
              </div>
              <div className="max-w-xl">
                <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 text-zinc-500">{s.body}</p>
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
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Features</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Built for technical interviews
          </h2>
          <p className="mt-3 text-zinc-500">
            Everything happens in one focused room — collaboration, execution, AI and analytics.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-zinc-900/5"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-zinc-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[300px_1fr]">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">FAQ</h2>
          <p className="mt-3 text-sm text-zinc-500">
            Answers about how CodeSync works, execution safety, and reviewing sessions.
          </p>
        </div>
        <div>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-medium text-zinc-900">{item.q}</span>
                  {isOpen ? (
                    <Minus className="h-5 w-5 shrink-0 text-indigo-600" />
                  ) : (
                    <Plus className="h-5 w-5 shrink-0 text-indigo-600" />
                  )}
                </button>
                {isOpen && <p className="-mt-1 pb-5 pr-8 text-sm leading-relaxed text-zinc-500">{item.a}</p>}
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
    <section className="bg-[#0d0d10] text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:px-6 sm:py-20 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to interview better?
        </h2>
        <Link
          href={startHref}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Start your first interview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 text-sm text-white/40 sm:px-6">
          <span className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-indigo-400" /> CodeSync AI
          </span>
          <span>Built for collaborative coding interviews</span>
        </div>
      </div>
    </section>
  );
}
