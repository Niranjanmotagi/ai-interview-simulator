'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/pricing', label: 'Pricing', hideOnMobile: false },
  { href: '/about', label: 'About', hideOnMobile: true },
  { href: '/login', label: 'Log in', hideOnMobile: false },
];

/** Floating bottom dock — the reference's signature navigation element. */
export function Dock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex max-w-[calc(100vw-1.5rem)] items-center gap-0.5 rounded-full bg-zinc-900/95 p-1.5 pl-2.5 shadow-xl ring-1 ring-black/40 backdrop-blur sm:gap-1 sm:p-2 sm:pl-3">
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white',
            pathname === '/' && 'text-white',
          )}
        >
          <Home className="h-4 w-4" />
        </Link>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:px-3.5',
              link.hideOnMobile && 'hidden sm:block',
              pathname.startsWith(link.href) && 'text-white',
            )}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/register"
          className="group ml-0.5 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-600 bg-zinc-950 px-3.5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 sm:ml-1 sm:gap-2 sm:px-4"
        >
          Get started
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </nav>
  );
}
