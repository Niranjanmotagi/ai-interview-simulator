'use client';

import { useEffect, useState } from 'react';

/** Big top-right clock, like the reference header. Renders after mount to avoid hydration drift. */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-10 w-28" aria-hidden />;
  }

  let hours = now.getHours();
  const meridiem = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <div className="flex items-start gap-1.5" aria-label={`Current time ${hours}:${minutes} ${meridiem}`}>
      <span className="font-display text-3xl font-bold leading-none tracking-tight tabular-nums">
        {hours}:{minutes}
      </span>
      <span className="flex flex-col text-[10px] font-bold leading-tight text-zinc-500">
        <span>{meridiem}</span>
        <span>{date}</span>
      </span>
    </div>
  );
}
