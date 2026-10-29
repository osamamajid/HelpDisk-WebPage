/**
 * Origin helpers.
 *
 * Two different backends are reachable at runtime and conflating them produces
 * broken links: the Next server talks to the container network
 * (`API_INTERNAL_URL`), while every URL embedded in HTML must be the origin the
 * *browser* can reach (`NEXT_PUBLIC_API_URL`).
 */

/** Internal origin, used only for server-to-server fetches. Never rendered. */
export function internalApiBase(): string {
  const raw =
    process.env.API_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000';
  return stripTrailing(raw);
}

/**
 * Browser-facing origin used to build download links.
 *
 * An empty value is meaningful: it means the app is served behind the same
 * origin (nginx proxies `/api/` to the backend), so links stay relative.
 */
export function publicApiBase(): string {
  return stripTrailing(process.env.NEXT_PUBLIC_API_URL ?? '');
}

/** Site origin used for metadata and absolute page links. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
  return stripTrailing(raw);
}

function stripTrailing(value: string): string {
  return value.replace(/\/+$/, '');
}
