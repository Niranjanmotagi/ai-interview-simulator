import { cn } from '@/lib/utils';

interface MarqueeProps {
  items: string[];
  className?: string;
  reverse?: boolean;
  slow?: boolean;
}

/** Infinite horizontal text ticker, like the reference footer strips. */
export function Marquee({ items, className, reverse, slow }: MarqueeProps) {
  const row = (ariaHidden: boolean) => (
    <div className="flex w-max shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="mx-4 whitespace-nowrap">
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className={cn(
          'flex w-max',
          reverse ? 'animate-marquee-reverse' : slow ? 'animate-marquee-slow' : 'animate-marquee',
        )}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
