import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Sticker-style badges: bordered candy pills, like the reference tags. */
const badgeVariants = cva(
  'inline-flex items-center rounded-full border-2 border-zinc-900/90 px-2.5 py-0.5 text-xs font-bold',
  {
    variants: {
      variant: {
        default: 'border-zinc-900 bg-zinc-900 text-white',
        secondary: 'bg-pastel-sky text-zinc-900',
        destructive: 'bg-pastel-salmon text-zinc-900',
        outline: 'bg-white text-zinc-900',
        success: 'bg-pastel-mint text-zinc-900',
        warning: 'bg-pastel-lemon text-zinc-900',
        purple: 'bg-pastel-lavender text-zinc-900',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
