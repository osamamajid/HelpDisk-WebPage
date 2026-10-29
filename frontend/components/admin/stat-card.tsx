import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Compact metric tile for the admin dashboard. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={cn('flex size-7 items-center justify-center rounded-md bg-primary-muted text-primary')}>
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight bidi-safe" dir="ltr">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
