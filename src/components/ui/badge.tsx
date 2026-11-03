import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'border-border text-foreground',
        success: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        warning: 'border-amber-500/20 bg-amber-500/15 text-amber-700 dark:text-amber-300',
        info: 'border-sky-500/20 bg-sky-500/15 text-sky-700 dark:text-sky-400',
        purple: 'border-purple-500/20 bg-purple-500/15 text-purple-700 dark:text-purple-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
