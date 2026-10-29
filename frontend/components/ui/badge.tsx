import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        // Lower-contrast so badge clusters stop competing with the content.
        secondary: 'border-transparent bg-secondary/60 text-secondary-foreground',
        outline: 'border-border text-foreground',
        muted: 'border-transparent bg-muted/60 text-muted-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/20 text-warning',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Render the badge on a child element, e.g. a Link, without nesting spans. */
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, children, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
