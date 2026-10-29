import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { FilesBrowser } from '@/components/file/files-browser';
import { Skeleton } from '@/components/ui/skeleton';
import { loadTaxonomy } from '@/lib/api/taxonomy';

export async function generateMetadata() {
  const t = await getTranslations('file');
  return { title: t('favoritesTitle') };
}

export default async function FavoritesPage() {
  const t = await getTranslations('file.favorites');
  const taxonomy = await loadTaxonomy();

  return (
    <div className="container space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>

      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <FilesBrowser
          categories={taxonomy.categories}
          brands={taxonomy.brands}
          operatingSystems={taxonomy.operatingSystems}
          lockedQuery={{ is_favorite: true }}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </Suspense>
    </div>
  );
}
