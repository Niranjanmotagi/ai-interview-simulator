'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/login', label: 'Log in' },
];

/** Floating bottom dock — the reference's signature navigation element. */
export function Dock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div className="flex items-center gap-1 rounded-full bg-zinc-900/95 p-2 pl-3 shadow-xl ring-1 ring-black/40 backdrop-blur">
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white',
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
              'rounded-full px-3.5 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white',
              pathname.startsWith(link.href) && 'text-white',
            )}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/register"
          className="group ml-1 flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
        >
          Get started
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </nav>
  );
}
