import { ArrowRight, HardDriveDownload, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { CategoryGrid, FileStrip } from '@/components/file/file-strip';
import { SearchForm } from '@/components/layout/search-form';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { CategoryRead, FileListItem } from '@/lib/api/types';

/**
 * Home is fully server-rendered against the internal API: the first paint has
 * real content, and the only client JS is the small interactive island.
 * A backend outage degrades to an empty library instead of an error page.
 */
async function safeList<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error('[home] load failed:', error);
    return fallback;
  }
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const api = await getServerApi();

  const [categories, recent, trending, favorites] = await Promise.all([
    safeList<CategoryRead[]>(() => api.categories.list(), []),
    safeList<FileListItem[]>(() => api.files.recent(6), []),
    safeList<FileListItem[]>(() => api.files.trending(6), []),
    safeList<FileListItem[]>(() => api.files.favorites(6), []),
  ]);

  return (
    <div className="container space-y-10 py-8">
      <section className="flex flex-col items-center gap-4 py-6 text-center sm:py-10">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="size-4" aria-hidden />
          {t('eyebrow')}
        </div>
        <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t('title')}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">{t('subtitle')}</p>

        <SearchForm size="lg" className="w-full max-w-2xl" />

        <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/search">
              {t('browseAll')}
              <ArrowRight className="rtl:rotate-180" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link href="/favorites">
              <HardDriveDownload className="size-4" />
              {t('favorites')}
            </Link>
          </Button>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">{t('categories')}</h2>
          <CategoryGrid categories={categories} emptyLabel={t('empty.categories')} />
        </section>
      ) : null}

      <FileStrip
        title={t('recent')}
        files={recent}
        href="/search?order=recent"
        linkLabel={t('viewAll')}
        emptyLabel={t('empty.recent')}
      />

      <FileStrip
        title={t('trending')}
        files={trending}
        href="/search?order=downloads"
        linkLabel={t('viewAll')}
        emptyLabel={t('empty.trending')}
      />

      {favorites.length > 0 ? (
        <FileStrip
          title={t('favorites')}
          files={favorites}
          href="/favorites"
          linkLabel={t('viewAll')}
        />
      ) : null}
    </div>
  );
}
