/**
 * Server-side API client for React Server Components and route handlers.
 *
 * Talks straight to the backend over the internal URL so no proxy hop is needed
 * during rendering, forwarding the session cookie as a Bearer token.
 */
import { cookies } from 'next/headers';

import { COOKIES } from '@/lib/constants';
import type { Fetcher } from './http';
import { createApi } from './endpoints';
import { internalApiBase, publicApiBase } from './urls';

/**
 * Build an API instance for the current request.
 *
 * `next/headers` is dynamic, so calling this inside a server component opts
 * that component out of static rendering — which is what we want for data that
 * depends on the caller's session.
 */
export async function getServerApi(): Promise<Api> {
  const base = internalApiBase();
  const jar = await cookies();
  const token = jar.get(COOKIES.access)?.value ?? null;

  const fetcher: Fetcher = (path, init) =>
    fetch(`${base}/api/v1${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      cache: 'no-store',
    });

  // Fetch over the internal origin, but hand out browser-reachable links.
  return createApi(fetcher, publicApiBase());
}

type Api = Awaited<ReturnType<typeof createApi>>;

/** Read the raw access token, when present. */
export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIES.access)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIES.refresh)?.value ?? null;
}
