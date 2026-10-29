'use client';

import { ChevronDown, List, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS, SORT_ORDERS } from '@/lib/constants';
import { cn, formatCount } from '@/lib/utils';

interface ResultsToolbarProps {
  total: number;
  order: string;
  perPage: number;
  view: 'grid' | 'list';
  loading: boolean;
  filtersOpen?: boolean;
  onOrderChange: (next: string) => void;
  onPerPageChange: (next: number) => void;
  onViewChange: (next: 'grid' | 'list') => void;
  onToggleFilters?: () => void;
  className?: string;
}

/** Count line plus the sort / density / view controls above a result set. */
export function ResultsToolbar({
  total,
  order,
  perPage,
  view,
  loading,
  filtersOpen,
  onOrderChange,
  onPerPageChange,
  onViewChange,
  onToggleFilters,
  className,
}: ResultsToolbarProps) {
  const t = useTranslations('file.sort');
  const tv = useTranslations('file.results');

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {loading ? tv('loading') : tv('count', { total: formatCount(total) })}
      </p>

      <div className="ms-auto flex flex-wrap items-center gap-2">
        {onToggleFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            className="lg:hidden"
          >
            <SlidersHorizontal />
            {tv('filters')}
          </Button>
        ) : null}

        <Select value={order || SORT_ORDERS[0]} onValueChange={onOrderChange}>
          <SelectTrigger className="h-8 w-auto min-w-32 text-xs" aria-label={t('label')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_ORDERS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Density and view mode fold away behind a single disclosure. */}
        <details className="disclosure group relative">
          <summary className="flex h-8 list-none items-center gap-1 rounded-md border px-3 text-xs font-medium hover:bg-accent">
            {tv('viewOptions')}
            <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute end-0 top-full z-20 mt-1 w-max max-w-[calc(100vw-2rem)] space-y-2 rounded-lg border bg-popover p-3 shadow-md">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {tv('perPage')}
              <Select
                value={String(perPage || DEFAULT_PER_PAGE)}
                onValueChange={(value) => onPerPageChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-auto min-w-24 text-xs" aria-label={tv('perPage')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <div className="flex items-center gap-1" role="group">
              <Button
                variant={view === 'grid' ? 'subtle' : 'ghost'}
                size="icon-sm"
                onClick={() => onViewChange('grid')}
                aria-label={tv('gridView')}
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid />
              </Button>
              <Button
                variant={view === 'list' ? 'subtle' : 'ghost'}
                size="icon-sm"
                onClick={() => onViewChange('list')}
                aria-label={tv('listView')}
                aria-pressed={view === 'list'}
              >
                <List />
              </Button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
