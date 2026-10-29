'use client';

import * as React from 'react';

import { ApiError } from '@/lib/api/http';

interface UseRemoteListState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Minimal fetch-on-mount hook for client-rendered lists.
 *
 * `deps` is the serialisable query the caller derives from the URL: changing it
 * re-runs the request. Results of the previous run are kept while the next one
 * is in flight, so filter changes never blank the page.
 */
export function useRemoteList<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
  fallback: T,
): UseRemoteListState<T> {
  const [data, setData] = React.useState<T>(fallback);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);
  const loaderRef = React.useRef(loader);
  loaderRef.current = loader;

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loaderRef
      .current()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof ApiError ? cause.message : 'Request failed');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload: () => setNonce((value) => value + 1) };
}
