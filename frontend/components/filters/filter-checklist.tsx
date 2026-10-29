'use client';

import { Check, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  /** Optional right-aligned hint, e.g. a file count. */
  count?: number;
}

interface FilterChecklistProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Render the search box once a list is long enough to need it. */
  searchThreshold?: number;
  searchPlaceholder?: string;
  /** Wrap in a <details> disclosure. When false, render as a plain labelled group. */
  collapsible?: boolean;
  className?: string;
}

/**
 * Multi-select built from a `<details>` disclosure plus native checkboxes: no
 * portal, no focus trapping, keyboard friendly and RTL correct out of the box -
 * which is exactly what a long taxonomy list needs. Set `collapsible={false}`
 * to embed the same control inside a shared "More filters" disclosure.
 */
export function FilterChecklist({
  title,
  options,
  selected,
  onChange,
  searchThreshold = 8,
  searchPlaceholder,
  collapsible = true,
  className,
}: FilterChecklistProps) {
  const t = useTranslations('file.filters');
  const [term, setTerm] = React.useState('');
  const searchable = options.length > searchThreshold;

  const visible = React.useMemo(() => {
    if (!searchable || !term.trim()) return options;
    const needle = term.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, searchable, term]);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  if (options.length === 0) return null;

  const body = (
    <>
      {searchable ? (
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={searchPlaceholder ?? t('searchPlaceholder')}
          aria-label={searchPlaceholder ?? t('searchPlaceholder')}
          className="mt-2 h-8 text-xs"
        />
      ) : null}

      <ul className="mt-2 space-y-1.5">
        {visible.map((option) => {
          const checked = selected.includes(option.value);
          const id = `${title}-${option.value}`.replace(/\s+/g, '-');

          return (
            <li key={option.value}>
              <Label
                htmlFor={id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 text-sm font-normal',
                  checked && 'text-foreground',
                )}
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {typeof option.count === 'number' ? (
                  <span className="bidi-safe text-2xs text-muted-foreground" dir="ltr">
                    {option.count}
                  </span>
                ) : null}
                {checked ? <Check className="size-3 text-primary" aria-hidden /> : null}
              </Label>
            </li>
          );
        })}
        {visible.length === 0 ? (
          <li className="text-xs text-muted-foreground">{t('noOptions')}</li>
        ) : null}
      </ul>

      {selected.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-2 text-2xs font-medium text-primary hover:underline"
        >
          {t('clear')}
        </button>
      ) : null}
    </>
  );

  if (!collapsible) {
    return (
      <section className={className}>
        <h3 className="mb-1 text-sm font-medium">{title}</h3>
        {body}
      </section>
    );
  }

  return (
    <details className={cn('disclosure group', className)}>
      <summary className="flex list-none items-center justify-between gap-2 text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
          {title}
        </span>
        {selected.length > 0 ? (
          <span className="rounded-full bg-primary-muted px-1.5 text-2xs font-semibold text-primary">
            {selected.length}
          </span>
        ) : null}
      </summary>
      {body}
    </details>
  );
}
