import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Human readable file size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${i === 0 ? value.toFixed(0) : value.toFixed(decimals)} ${units[i]}`;
}

/** Compact thousand separator for counters (downloads, file counts). */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'standard' }).format(value ?? 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

/**
 * Relative label such as "3 days ago". Falls back to a plain dash when the
 * value is missing so tables never render "Invalid Date".
 */
export function formatRelative(
  value: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(Math.round(diff / 1000), 'second');
}

/** Normalise an extension to lower-case without the leading dot. */
export function normalizeExtension(ext: string | null | undefined): string {
  return (ext ?? '').toLowerCase().replace(/^\./, '');
}

/** Build a query string, skipping empty values and repeating array entries. */
export function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === '') continue;
        search.append(key, String(item));
      }
      continue;
    }
    if (typeof value === 'boolean') {
      search.set(key, value ? 'true' : 'false');
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Uppercase extension badge text, capped so long extensions never break layout. */
export function extensionLabel(ext: string | null | undefined, max = 5): string {
  const normalized = normalizeExtension(ext);
  if (!normalized) return 'FILE';
  return normalized.slice(0, max).toUpperCase();
}

export function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<T>).then === 'function'
  );
}
