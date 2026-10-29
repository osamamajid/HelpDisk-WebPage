'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  size?: 'default' | 'lg';
  /** Keeps the current query in sync when rendered on the results page. */
  syncWithUrl?: boolean;
  onSubmit?: () => void;
}

/**
 * Submits to /search as a GET form, so it works with no JavaScript and keeps
 * results shareable/bookmarkable.
 */
export function SearchForm({
  className,
  inputClassName,
  size = 'default',
  syncWithUrl = false,
  onSubmit,
  autoFocus,
}: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('file.search');

  const urlQuery = params.get('q') ?? '';
  const [value, setValue] = React.useState(urlQuery);

  // Only the results page needs two-way binding; other pages keep the field
  // independent so navigating away does not rewrite the user's draft.
  React.useEffect(() => {
    if (syncWithUrl) setValue(urlQuery);
  }, [syncWithUrl, urlQuery]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Let the native GET submit build the URL when JS is unavailable.
    const next = new URLSearchParams(params.toString());
    const trimmed = value.trim();
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    next.delete('page');
    if (pathname !== '/search') {
      event.preventDefault();
      router.push(`/search?${next.toString()}`);
      return;
    }
    router.replace(`/search?${next.toString()}`, { scroll: false });
    onSubmit?.();
  }

  return (
    <form
      action="/search"
      method="get"
      onSubmit={handleSubmit}
      role="search"
      className={cn('relative flex w-full items-center', className)}
    >
      <Search
        className={cn(
          'pointer-events-none absolute start-3 size-4 text-muted-foreground',
          size === 'lg' && 'size-5 start-4',
        )}
        aria-hidden
      />
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus={autoFocus}
        placeholder={t('placeholder')}
        aria-label={t('label')}
        className={cn(
          'ps-9',
          size === 'lg' && 'h-12 ps-11 text-base',
          inputClassName,
        )}
      />
    </form>
  );
}
