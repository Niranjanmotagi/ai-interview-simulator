'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/lib/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              // Never retry auth failures; retry network blips once.
              const status = (error as { status?: number }).status;
              if (status === 401 || status === 403 || status === 404) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      }),
  );

  const initialize = useAuth((s) => s.initialize);
  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
