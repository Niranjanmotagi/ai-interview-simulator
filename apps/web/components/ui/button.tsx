import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-white hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0',
        secondary:
          'border-2 border-zinc-900 bg-pastel-lemon text-zinc-900 shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-hard-sm',
        outline:
          'border-2 border-zinc-900 bg-white text-zinc-900 shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-hard-sm',
        ghost: 'text-zinc-700 hover:bg-zinc-900/5 hover:text-zinc-900',
        destructive:
          'border-2 border-zinc-900 bg-pastel-salmon text-zinc-900 shadow-hard-sm hover:-translate-y-0.5',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants };
