/**
 * Session cookie management for the Next layer.
 *
 * Tokens are httpOnly so client scripts cannot read them; the API proxy
 * (app/api/v1/[...segments]/route.ts) is the only place that turns the cookie
 * back into an Authorization header.
 */
import type { cookies } from 'next/headers';

import { COOKIES } from '@/lib/constants';

/** The writable jar returned by `await cookies()` in a route handler. */
export type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Tokens are large JWTs; keep them out of any cache/CDN layer. */
const MAX_COOKIE_BYTES = 32 * 1024;

/** `secure` may only be sent when the site is actually served over HTTPS. */
function isHttpsSite(): boolean {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? '').toLowerCase().startsWith('https://');
}

export function setSessionCookies(
  cookies: CookieStore,
  tokens: { access_token: string; refresh_token?: string | null; expires_in?: number },
): void {
  const maxAge = Math.max(tokens.expires_in ?? 60 * 60 * 24, 60);

  cookies.set(COOKIES.access, tokens.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsSite(),
    path: '/',
    maxAge,
  });

  if (tokens.refresh_token) {
    // Refresh tokens outlive access tokens; cap at the access window so a
    // stale refresh token cannot silently extend a session.
    cookies.set(COOKIES.refresh, tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttpsSite(),
      path: '/',
      maxAge,
    });
  }
}

export function clearSessionCookies(cookies: CookieStore): void {
  cookies.delete(COOKIES.access);
  cookies.delete(COOKIES.refresh);
}

/** True when a cookie value fits inside browser size limits. */
export function cookieFits(value: string): boolean {
  return new TextEncoder().encode(value).length <= MAX_COOKIE_BYTES;
}
