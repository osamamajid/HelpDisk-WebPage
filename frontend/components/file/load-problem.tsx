'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface LoadProblemProps {
  /** True when the backend rejected the request as rate-limited (429). */
  rateLimited: boolean;
}

/**
 * Non-404 detail-load failure state. Shown when the file exists but the request
 * failed (rate limit or backend outage) so those are never mistaken for "not
 * found". Retry is user-initiated only — there is no automatic request loop.
 */
export function LoadProblem({ rateLimited }: LoadProblemProps) {
  const router = useRouter();
  const t = useTranslations('file');

  return (
    <div className="container py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <AlertTriangle className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold tracking-tight">{t('results.errorTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {rateLimited ? t('loadRateLimited') : t('loadFailed')}
        </p>
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            {t('results.retry')}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">{t('crumbs.home')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
