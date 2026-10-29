import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { FilesBrowser } from '@/components/file/files-browser';
import { Skeleton } from '@/components/ui/skeleton';
import { loadTaxonomy } from '@/lib/api/taxonomy';

export async function generateMetadata() {
  const t = await getTranslations('file');
  return { title: t('search.resultsTitle') };
}

/**
 * `useSearchParams` in the browser island needs a Suspense boundary, otherwise
 * the whole route would render dynamically on every request.
 */
function BrowserSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <Skeleton className="hidden h-96 rounded-lg lg:block" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-full max-w-sm" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const taxonomy = await loadTaxonomy();

  return (
    <div className="container py-8">
      <Suspense fallback={<BrowserSkeleton />}>
        <FilesBrowser
          categories={taxonomy.categories}
          brands={taxonomy.brands}
          operatingSystems={taxonomy.operatingSystems}
          initialQuery={q ? { q } : undefined}
        />
      </Suspense>
    </div>
  );
}
