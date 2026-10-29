import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { clearSessionCookies, cookieFits, setSessionCookies } from '@/lib/auth/cookies';
import { internalApiBase } from '@/lib/api/urls';
import type { Token } from '@/lib/api/types';

/**
 * Exchanges credentials for a backend JWT and stores it in a first-party
 * httpOnly cookie. The browser never sees the token itself.
 */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  const username = payload?.username?.trim();
  const password = payload?.password;

  if (!username || !password) {
    return NextResponse.json(
      { detail: 'Username and password are required' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${internalApiBase()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { detail: 'Cannot reach the authentication service' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const raw = await upstream.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!upstream.ok) {
    const detail =
      (body as { detail?: string } | null)?.detail ?? 'Login failed';
    return NextResponse.json({ detail }, { status: upstream.status });
  }

  const token = body as Token;
  if (!token?.access_token) {
    return NextResponse.json(
      { detail: 'Malformed token response from backend' },
      { status: 502 },
    );
  }

  // JWTs are long; a cookie over the browser limit would fail silently.
  if (!cookieFits(token.access_token)) {
    const store = await cookies();
    clearSessionCookies(store);
    return NextResponse.json(
      { detail: 'Access token is too large to store in a session cookie' },
      { status: 500 },
    );
  }

  const store = await cookies();
  setSessionCookies(store, token);

  return NextResponse.json(
    { success: true, expires_in: token.expires_in },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
