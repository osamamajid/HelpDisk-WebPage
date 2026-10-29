import { NextRequest, NextResponse } from 'next/server';

import { internalApiBase } from '@/lib/api/urls';
import { COOKIES } from '@/lib/constants';

/**
 * Same-origin bridge to the FastAPI backend.
 *
 * Why this exists: the backend sets `allow_credentials=True` with a wildcard
 * CORS origin, which browsers reject for credentialed cross-origin calls. Going
 * through this first-party route keeps the session cookie readable, lets the
 * server attach the Authorization header, and avoids exposing the container
 * network address to the browser.
 */

/** Hop-by-hop and host headers that must never be forwarded. */
const OMITTED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'cookie',
  'authorization',
]);

const OMITTED_RESPONSE_HEADERS = new Set([
  'content-security-policy',
  'set-cookie',
  'transfer-encoding',
  'content-length',
  'connection',
]);

/** RequestInit plus the streaming-body flag accepted by undici. */
type FetchInit = RequestInit & { duplex?: 'half' | 'full' };

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function PUT(request: NextRequest) {
  return proxy(request);
}

export async function PATCH(request: NextRequest) {
  return proxy(request);
}

export async function DELETE(request: NextRequest) {
  return proxy(request);
}

async function proxy(request: NextRequest): Promise<NextResponse> {
  const segments = request.nextUrl.pathname
    .split('/')
    .filter(Boolean)
    .slice(2); // drop the leading "api/v1"

  const target = new URL(`${internalApiBase()}/api/v1/${segments.join('/')}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!OMITTED_REQUEST_HEADERS.has(key)) headers.set(key, value);
  });

  // Forward the session as a bearer token; the backend accepts either.
  const token = request.cookies.get(COOKIES.access)?.value;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const init: FetchInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // Stream rather than buffer: uploads can be gigabytes.
    init.body = request.body;
    // Required by undici when the request body is a stream. Not in the DOM lib.
    init.duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), init as RequestInit);
  } catch (error) {
    console.error('[proxy] upstream request failed', target.pathname, error);
    return NextResponse.json(
      { detail: 'Backend unavailable' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  OMITTED_RESPONSE_HEADERS.forEach((name) => responseHeaders.delete(name));
  responseHeaders.set('Cache-Control', 'no-store');

  // Empty bodies must not be re-parsed, or Next throws on the null stream.
  const contentLength = upstream.headers.get('content-length');
  if (upstream.status === 204 || upstream.status === 304 || contentLength === '0') {
    return new NextResponse(null, { status: upstream.status, headers: responseHeaders });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
