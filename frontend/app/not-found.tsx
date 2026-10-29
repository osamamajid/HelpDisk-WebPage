import { FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/ui/empty-state';
import { HomeLink } from '@/components/layout/home-link';

/** Root fallback: any unmatched route or `notFound()` call lands here. */
export default async function NotFound() {
  const t = await getTranslations('errors');

  return (
    <div className="container py-16">
      <EmptyState
        icon={FileQuestion}
        title={t('notFoundTitle')}
        description={t('notFoundDescription')}
        action={<HomeLink label={t('backHome')} />}
      />
    </div>
  );
}
