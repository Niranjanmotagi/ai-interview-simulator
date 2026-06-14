'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Code2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/interviews', label: 'Interviews', icon: MessageSquareText },
  { href: '/rooms', label: 'Live Rooms', icon: Code2 },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1.5 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold transition-colors',
              active
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r-2 border-zinc-900/10 bg-background lg:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-5 font-display text-base font-bold"
        >
          <Sparkles className="h-5 w-5 text-brand" />
          AI Interview Sim
        </Link>
        {nav}
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-5 w-5 text-primary" /> AI Interview Sim
              </span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
            <div className="border-t p-3">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b-2 border-zinc-900/10 bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant={user?.plan === 'free' ? 'secondary' : 'default'}>
              {user?.plan === 'free' ? 'Free plan' : user?.plan === 'pro' ? 'Pro' : 'Pro+'}
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-pastel-mint text-sm font-bold text-zinc-900">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </header>
        <main className="bg-dots flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
