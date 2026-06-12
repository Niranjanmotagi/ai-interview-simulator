import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-dots flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-xl font-bold">
        <Sparkles className="h-5 w-5 text-brand" />
        AI Interview Simulator
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
