import { getRequestConfig } from 'next-intl/server';

import { loadMessages } from './messages';
import { resolveLocale } from './resolve';

/**
 * Referenced by `createNextIntlPlugin` in next.config.mjs. next-intl runs this
 * per request, so the locale and the html direction stay in sync.
 */
export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
