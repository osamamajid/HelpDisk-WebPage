import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/** Title + description + optional action slot, used at the top of every admin page. */
export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b pb-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
