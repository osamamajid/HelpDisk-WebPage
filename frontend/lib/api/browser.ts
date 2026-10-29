/**
 * Browser-side API client.
 *
 * Requests are sent to the same-origin Next proxy (`/api/v1/*`) rather than to
 * the backend directly: the access token lives in an httpOnly cookie on the
 * first-party origin, and the proxy turns it into an Authorization header.
 */
import { API_PREFIX } from '@/lib/constants';
import type { Fetcher } from './http';
import { createApi } from './endpoints';
import { publicApiBase } from './urls';

/** Backend origin as seen by the browser. Used for public download links. */
export const apiBase = publicApiBase();

const fetcher: Fetcher = (path, init) =>
  fetch(`${API_PREFIX}${path}`, {
    ...init,
    credentials: 'same-origin',
  });

export const api = createApi(fetcher, apiBase);
