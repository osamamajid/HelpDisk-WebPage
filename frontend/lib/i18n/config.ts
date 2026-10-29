/**
 * Locale registry. English is LTR, Arabic is RTL; everything layout-related
 * keys off `dirFor()` so a new language only needs an entry here.
 */
import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES, type Locale } from '@/lib/constants';

export { DEFAULT_LOCALE, LOCALES };
export type { Locale };

export const localeOptions: ReadonlyArray<{ value: Locale; label: string; dir: 'ltr' | 'rtl' }> = [
  { value: 'en', label: 'English', dir: 'ltr' },
  { value: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', dir: 'rtl' },
];

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

/** Intl locale used for date/number formatting within a UI locale. */
export function intlTagFor(locale: Locale): string {
  return locale === 'ar' ? 'ar' : 'en';
}
