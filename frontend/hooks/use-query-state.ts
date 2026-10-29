'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

/**
 * URL is the single source of truth for browsing state (page, filters, sort),
 * so results stay shareable and the back button behaves. Every mutation copies
 * the current query, changes one key and resets `page` unless asked otherwise.
 */
export function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const write = React.useCallback(
    (changes: Record<string, string | number | readonly string[] | null | undefined>, keepPage = false) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        next.delete(key);
        if (value === null || value === undefined || value === '') continue;
        // Arrays become repeated keys, which is how FastAPI parses list params.
        if (Array.isArray(value)) {
          for (const item of value) next.append(key, String(item));
          continue;
        }
        next.set(key, String(value));
      }
      if (!keepPage) next.delete('page');
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const replace = React.useCallback(
    (changes: Record<string, string | number | readonly string[] | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        next.delete(key);
        if (value === null || value === undefined || value === '') continue;
        if (Array.isArray(value)) {
          for (const item of value) next.append(key, String(item));
          continue;
        }
        next.set(key, String(value));
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearAll = React.useCallback(
    (keep: string[] = []) => {
      const next = new URLSearchParams();
      for (const key of keep) {
        const value = searchParams.get(key);
        if (value) next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return {
    searchParams,
    get: (key: string) => searchParams.get(key) ?? '',
    getAll: (key: string) => searchParams.getAll(key),
    hasValues: (key: string) => searchParams.getAll(key).length > 0,
    write,
    replace,
    clearAll,
  };
}
