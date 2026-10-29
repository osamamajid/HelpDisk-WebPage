import { useTranslations } from 'next-intl';
import Link from 'next/link';

/**
 * Server component by default: it renders no state, so keeping it out of the
 * client bundle avoids shipping a component the browser never interacts with.
 */
export function Footer() {
  const t = useTranslations('footer');
  const c = useTranslations('common');

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{c('appName')}</p>
          <p className="text-xs text-muted-foreground">{t('tagline')}</p>
        </div>

        <nav aria-label={t('linksLabel')} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/search" className="text-xs text-muted-foreground hover:text-foreground">
            {t('browse')}
          </Link>
          <Link href="/favorites" className="text-xs text-muted-foreground hover:text-foreground">
            {t('favorites')}
          </Link>
          <Link
            href="/admin/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('admin')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
