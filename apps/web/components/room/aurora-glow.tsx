'use client';

/**
 * Subtle drifting color "aurora" — three heavily-blurred, low-opacity blobs in
 * the accent palette. Adds atmosphere/depth to the dark surface without the
 * distraction the spec warns against (slow 20s+ easing, low opacity).
 */
export function AuroraGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-80 w-80 animate-aurora-1 rounded-full bg-emerald-500/20 blur-[110px]" />
      <div className="absolute right-0 top-10 h-72 w-72 animate-aurora-2 rounded-full bg-sky-500/15 blur-[120px]" />
      <div className="absolute left-1/3 top-40 h-72 w-72 animate-aurora-1 rounded-full bg-violet-500/15 blur-[130px]" />
    </div>
  );
}
