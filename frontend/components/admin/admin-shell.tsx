import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LogoutButton } from '@/components/layout/logout-button';
import { SiteNav } from '@/components/layout/site-nav';
import { ADMIN_NAV } from '@/lib/constants';
import type { UserRead } from '@/lib/api/types';

/**
 * Chrome around every protected admin page. The public header/footer stay from
 * the root layout; this adds a section rail that collapses to a horizontal,
 * scrollable strip on small screens so no client JS is required.
 */
export function AdminShell({
  user,
  children,
}: {
  user: UserRead;
  children: React.ReactNode;
}) {
  const t = useTranslations('admin.shell');
  const c = useTranslations('common');

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="surface p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LayoutDashboard className="size-4" aria-hidden />
            </span>
            {t('brand')}
          </div>
          <SiteNav items={ADMIN_NAV} namespace="admin" orientation="vertical" />

          <div className="hairline mt-3 flex flex-col gap-1 pt-3 text-sm">
            <p className="px-2 pt-1 text-xs text-muted-foreground">
              {t('signedInAs')} <span className="font-medium text-foreground">{user.username}</span>
            </p>
            <Link
              href="/"
              className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t('backToSite')}
            </Link>
            <LogoutButton className="justify-start" />
          </div>
        </div>
      </aside>

      <main className="min-w-0 space-y-6" aria-label={c('appName')}>
        {children}
      </main>
    </div>
  );
}
