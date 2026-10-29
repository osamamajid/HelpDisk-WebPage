'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
  className?: string;
}

/**
 * Reminders of what is currently filtered. Without them a zero-result page is
 * confusing, because the sidebar is collapsed on small screens.
 */
export function ActiveFilters({ chips, onClearAll, className }: ActiveFiltersProps) {
  const t = useTranslations('file.filters');

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="text-xs text-muted-foreground">{t('active')}:</span>
      {chips.map((chip) => (
        <Badge key={chip.key} variant="muted" className="gap-1 font-normal">
          <span className="max-w-40 truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={t('removeFilter')}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onClearAll}>
        {t('clearAll')}
      </Button>
    </div>
  );
}
