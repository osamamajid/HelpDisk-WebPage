/**
 * Locale resolution for a request.
 *
 * Precedence: explicit user choice (cookie) -> Accept-Language -> default.
 * Middleware writes the cookie so server components and the client always
 * agree, which matters because the html `dir` attribute must match the
 * messages that get rendered.
 */
import { cookies, headers } from 'next/headers';

import { COOKIES, DEFAULT_LOCALE } from '@/lib/constants';
import { isLocale, type Locale } from './config';

export async function resolveLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(COOKIES.locale)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerList = await headers();
  return pickFromAcceptLanguage(headerList.get('accept-language'));
}

/** Best-match the first supported language advertised by the browser. */
export function pickFromAcceptLanguage(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  for (const entry of value.split(',')) {
    const tag = entry.split(';')[0]?.trim().toLowerCase();
    if (!tag) continue;
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
