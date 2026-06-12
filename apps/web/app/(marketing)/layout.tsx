import { LiveClock } from '@/components/marketing/live-clock';
import { Dock } from '@/components/marketing/dock';
import { Marquee } from '@/components/marketing/marquee';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container flex h-20 items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-bold text-amber-500">
          <span className="text-2xl" aria-hidden>
            👋
          </span>
          Hello!
        </span>
        <LiveClock />
      </header>

      {/* Bottom padding clears the floating dock. */}
      <main className="flex-1 pb-32">{children}</main>

      <footer className="space-y-2 overflow-hidden pb-28 pt-10">
        <Marquee
          className="font-display text-3xl font-bold text-zinc-300 sm:text-4xl"
          items={Array(6).fill('Practice → Improve → Get hired →')}
        />
        <Marquee
          reverse
          className="font-display text-3xl font-bold text-zinc-300 sm:text-4xl"
          items={Array(6).fill('Code & crafted with 💛 — AI Interview Simulator')}
        />
        <p className="pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AI Interview Simulator · Built with Next.js, Express &
          Gemini
        </p>
      </footer>

      <Dock />
    </div>
  );
}
