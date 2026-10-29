/**
 * Message loading. Each locale is split into namespaces under
 * lib/i18n/locales/<locale>/ so translations stay reviewable, then merged into
 * the single object next-intl expects.
 */
import { isLocale, type Locale } from './config';
import { DEFAULT_LOCALE } from '@/lib/constants';

export const NAMESPACES = ['common', 'nav', 'footer', 'home', 'file', 'admin', 'errors'] as const;
export type Namespace = (typeof NAMESPACES)[number];

/** Structurally compatible with next-intl's AbstractIntlMessages. */
export type Messages = { [key: string]: string | Messages };

export async function loadMessages(locale: Locale): Promise<Messages> {
  const safeLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const merged: Messages = {};
  await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`./locales/${safeLocale}/${ns}.json`);
        merged[ns] = (mod.default ?? {}) as Messages;
      } catch (error) {
        // A missing namespace must not take down the whole page.
        console.error(`[i18n] failed to load "${ns}" for "${safeLocale}"`, error);
        merged[ns] = {};
      }
    }),
  );
  return merged;
}
