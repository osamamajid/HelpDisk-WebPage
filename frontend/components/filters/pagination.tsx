'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pages: number;
  onGo: (page: number) => void;
  className?: string;
}

/** Windowed page numbers with leading/trailing ellipsis and prev/next arrows. */
export function Pagination({ page, pages, onGo, className }: PaginationProps) {
  const t = useTranslations('file.pagination');

  const numbers = React.useMemo(() => {
    const window = 1;
    const items: (number | 'gap')[] = [];
    for (let candidate = 1; candidate <= pages; candidate += 1) {
      const edge = candidate === 1 || candidate === pages;
      const near = Math.abs(candidate - page) <= window;
      if (edge || near) items.push(candidate);
      else if (items[items.length - 1] !== 'gap') items.push('gap');
    }
    return items;
  }, [page, pages]);

  if (pages <= 1) return null;

  return (
    <nav
      aria-label={t('label')}
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onGo(page - 1)}
        disabled={page <= 1}
        aria-label={t('previous')}
      >
        {/* Arrows must point backwards in RTL, which logical utilities fix. */}
        <ChevronLeft className="rtl:hidden" />
        <ChevronRight className="hidden rtl:block" />
      </Button>

      <ul className="flex items-center gap-1">
        {numbers.map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} className="px-1 text-sm text-muted-foreground" aria-hidden>
              &#8230;
            </li>
          ) : (
            <li key={item}>
              <Button
                variant={item === page ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => onGo(item)}
                aria-current={item === page ? 'page' : undefined}
                className="bidi-safe"
              >
                {item}
              </Button>
            </li>
          ),
        )}
      </ul>

      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onGo(page + 1)}
        disabled={page >= pages}
        aria-label={t('next')}
      >
        <ChevronRight className="rtl:hidden" />
        <ChevronLeft className="hidden rtl:block" />
      </Button>
    </nav>
  );
}
