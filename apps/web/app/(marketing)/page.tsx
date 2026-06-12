'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  FileSearch,
  LineChart,
  ListChecks,
  MessageSquareText,
  Target,
} from 'lucide-react';
import { Marquee } from '@/components/marketing/marquee';
import { cn } from '@/lib/utils';

const KEYWORDS = [
  'STAR method', 'Behavioral', 'System design', 'React', 'Node.js', 'Resume gaps',
  'Follow-ups', 'Rubric scoring', 'TypeScript', 'HR rounds', 'Trade-offs', 'Storytelling',
  'ATS keywords', 'Mock loops', 'Weak spots', 'Model answers',
];

const STICKERS = [
  { label: '🎯 personalized', color: 'bg-pastel-lemon', tilt: '-rotate-3' },
  { label: '📄 resume-aware', color: 'bg-pastel-sky', tilt: 'rotate-2' },
  { label: '🔥 adaptive follow-ups', color: 'bg-pink-200', tilt: '-rotate-2' },
  { label: '📈 rubric scoring', color: 'bg-pastel-mint', tilt: 'rotate-3' },
];

const BENTO = [
  {
    icon: FileSearch,
    title: 'Resume analysis',
    body: 'Upload once — AI extracts your skills and projects, scores the resume, and rewrites weak bullets.',
    color: 'bg-pastel-sky',
    span: 'lg:col-span-2',
  },
  {
    icon: Brain,
    title: 'Tailored questions',
    body: 'Generated from your resume, target role, and the JD — never a generic question bank.',
    color: 'bg-pastel-lavender',
    span: '',
  },
  {
    icon: MessageSquareText,
    title: 'Realistic interviews',
    body: 'Turn-based mock rounds with adaptive follow-ups when an answer needs probing.',
    color: 'bg-pastel-lemon',
    span: '',
  },
  {
    icon: Target,
    title: 'Rubric feedback',
    body: 'Relevance, structure, depth, communication — scored 0–10 with a model answer every time.',
    color: 'bg-pastel-salmon',
    span: 'lg:col-span-2',
  },
  {
    icon: ListChecks,
    title: 'Improvement plans',
    body: 'A prioritized action list built from your detected weaknesses after each session.',
    color: 'bg-pastel-mint',
    span: 'lg:col-span-2',
  },
  {
    icon: LineChart,
    title: 'Visible progress',
    body: 'Score trends, weakness heatmaps, and streaks keep your prep honest.',
    color: 'bg-pastel-peach',
    span: '',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        {/* Decorative keyword strip drifting behind the wordmark */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-8 opacity-60">
          <Marquee
            slow
            className="-rotate-2 text-sm font-medium text-zinc-400"
            items={KEYWORDS.map((k) => `${k} —`)}
          />
        </div>

        <div className="container relative flex flex-col items-center pb-16 pt-14 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-base text-zinc-600 sm:text-lg"
          >
            👋 Hey, I&apos;m your always-available interview coach and I&apos;m…
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-[17vw] font-bold leading-[0.95] tracking-tight text-zinc-900 sm:text-8xl lg:text-9xl"
          >
            INTERV<span className="text-brand">I</span>EW
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-[11vw] font-bold leading-none tracking-tight text-zinc-300 sm:text-6xl lg:text-7xl"
          >
            SIMULATOR
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {STICKERS.map((s) => (
              <span key={s.label} className={cn('sticker', s.color, s.tilt)}>
                {s.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-zinc-900 px-7 py-3.5 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Start practicing free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border-2 border-zinc-900 bg-white px-7 py-3.5 text-base font-bold text-zinc-900 shadow-hard-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
            >
              See pricing
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-sm text-zinc-500"
          >
            3 free mock interviews every month · No credit card required
          </motion.p>
        </div>
      </section>

      {/* ---------------- Bento features ---------------- */}
      <section className="bg-dots border-y border-zinc-900/10 py-20">
        <div className="container">
          <motion.h2
            {...fadeUp}
            className="mb-12 text-center font-display text-5xl font-bold tracking-tight sm:text-6xl"
          >
            The practice loop
          </motion.h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENTO.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={cn('rounded-3xl p-7', item.color, item.span)}
              >
                <item.icon className="mb-5 h-8 w-8 text-zinc-900" strokeWidth={1.7} />
                <h3 className="font-display text-2xl font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-800/80">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Gradient statement ---------------- */}
      <section className="container py-24 text-center">
        <motion.h2
          {...fadeUp}
          className="text-gradient-pop mx-auto max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl"
        >
          Built for candidates who want feedback, not just practice
        </motion.h2>
      </section>

      {/* ---------------- How it works (hard-shadow cards) ---------------- */}
      <section className="container pb-24">
        <motion.h2
          {...fadeUp}
          className="mb-12 text-center font-display text-5xl font-bold tracking-tight sm:text-6xl"
        >
          How it works
        </motion.h2>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Upload your resume',
              body: 'PDF or DOCX in, structured profile + resume score out.',
              tile: 'bg-pastel-sky',
              stacked: false,
            },
            {
              n: '02',
              title: 'Generate the interview',
              body: 'Pick a role, paste the JD, choose difficulty and round type.',
              tile: 'bg-pastel-lemon',
              stacked: true,
            },
            {
              n: '03',
              title: 'Answer, learn, improve',
              body: 'Rubric feedback per answer, a debrief, and a plan to fix weak spots.',
              tile: 'bg-pastel-mint',
              stacked: false,
            },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative"
            >
              {/* Stacked color layers behind the highlighted card, like the reference */}
              {step.stacked && (
                <>
                  <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-violet-400" aria-hidden />
                  <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-amber-300" aria-hidden />
                </>
              )}
              <div className="relative flex h-full items-start gap-4 rounded-2xl border-2 border-zinc-900/90 bg-white p-6 shadow-hard">
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900/90 font-display text-base font-bold',
                    step.tile,
                  )}
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{step.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="container pb-10 text-center">
        <motion.h2 {...fadeUp} className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
          Your next interview is<br />the one that counts
        </motion.h2>
        <motion.p {...fadeUp} className="mx-auto mt-5 max-w-xl text-zinc-600">
          Stop rehearsing generic question banks. Practice the interview you are actually going to
          have.
        </motion.p>
        <motion.div {...fadeUp} className="mt-9">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-zinc-900 px-8 py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Create your free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>
    </>
  );
}
