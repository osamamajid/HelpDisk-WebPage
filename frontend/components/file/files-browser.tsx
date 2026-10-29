'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { ActiveFilters, type ActiveFilterChip } from '@/components/filters/active-filters';
import { FilterPanel } from '@/components/filters/filter-panel';
import { Pagination } from '@/components/filters/pagination';
import { ResultsToolbar } from '@/components/filters/results-toolbar';
import { FileGrid } from '@/components/file/file-grid';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api/browser';
import type { BrandRead, CategoryRead, FileListItem, FileQuery, OSRead, PageMeta } from '@/lib/api/types';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS, SORT_ORDERS } from '@/lib/constants';
import { useQueryState } from '@/hooks/use-query-state';
import { useRemoteList } from '@/hooks/use-remote-list';
import { cn } from '@/lib/utils';

interface FilesBrowserProps {
  categories: CategoryRead[];
  brands: BrandRead[];
  operatingSystems: OSRead[];
  /** Filters the page owns itself (e.g. /favorites) and the user cannot change. */
  lockedQuery?: FileQuery;
  /** Hide the facet sidebar when a page has no use for it. */
  showFilters?: boolean;
  initialQuery?: FileQuery;
  emptyTitle?: string;
  emptyDescription?: string;
}

interface ListPayload {
  items: FileListItem[];
  meta: PageMeta | null;
}

const EMPTY_PAYLOAD: ListPayload = { items: [], meta: null };

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * The browsing surface: facets, toolbar, results and pagination in one client
 * island. State lives entirely in the URL, so a reload, a shared link and the
 * back button all reproduce the same list.
 */
export function FilesBrowser({
  categories,
  brands,
  operatingSystems,
  lockedQuery,
  showFilters = true,
  initialQuery,
  emptyTitle,
  emptyDescription,
}: FilesBrowserProps) {
  const t = useTranslations('file');
  const tResults = useTranslations('file.results');
  const { get, getAll, write, clearAll } = useQueryState();

  const q = get('q') || initialQuery?.q || '';
  const order = SORT_ORDERS.includes(get('order') as (typeof SORT_ORDERS)[number])
    ? get('order')
    : 'recent';
  const page = toPositiveInt(get('page'), 1);
  const perPage = readPerPage(get('per_page'));
  const categoryIds = getAll('category_id');
  const brandIds = getAll('brand_id');
  const osIds = getAll('os_id');
  const architectures = getAll('architectures');
  const favoritesOnly = get('is_favorite') === 'true';

  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Remember the density choice for the rest of the session.
  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem('idrv_view');
      if (stored === 'grid' || stored === 'list') setView(stored);
    } catch {
      /* private mode: keep the default */
    }
  }, []);

  function changeView(next: 'grid' | 'list') {
    setView(next);
    try {
      window.sessionStorage.setItem('idrv_view', next);
    } catch {
      /* ignore */
    }
  }

  const query = React.useMemo<FileQuery>(
    () => ({
      ...(q ? { q } : null),
      ...(categoryIds.length ? { category_id: categoryIds } : null),
      ...(brandIds.length ? { brand_id: brandIds } : null),
      ...(osIds.length ? { os_id: osIds } : null),
      ...(architectures.length ? { architectures } : null),
      ...(favoritesOnly ? { is_favorite: true } : null),
      ...lockedQuery,
      order,
      page,
      per_page: perPage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, categoryIds.join(), brandIds.join(), osIds.join(), architectures.join(), favoritesOnly, order, page, perPage],
  );

  const { data, loading, error, reload } = useRemoteList<ListPayload>(
    async () => {
      const res = await api.files.list(query);
      return { items: res.data ?? [], meta: res.meta ?? null };
    },
    [JSON.stringify(query)],
    EMPTY_PAYLOAD,
  );

  // Toggling a star only changes which rows belong in the list when the view is
  // filtered by favorites; reloading otherwise would be a redundant request.
  const favAffectsList = favoritesOnly || Boolean(lockedQuery && 'is_favorite' in lockedQuery);
  const handleFavoriteChanged = React.useCallback(() => {
    if (favAffectsList) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favAffectsList]);

  const nameOf = (list: { id: string; name: string }[], id: string) =>
    list.find((entry) => entry.id === id)?.name ?? id;

  const chips: ActiveFilterChip[] = [
    ...categoryIds.map((id) => ({
      key: `cat-${id}`,
      label: nameOf(flatten(categories), id),
      onRemove: () => write({ category_id: categoryIds.filter((item) => item !== id) }),
    })),
    ...brandIds.map((id) => ({
      key: `brand-${id}`,
      label: nameOf(brands, id),
      onRemove: () => write({ brand_id: brandIds.filter((item) => item !== id) }),
    })),
    ...osIds.map((id) => ({
      key: `os-${id}`,
      label: nameOf(operatingSystems, id),
      onRemove: () => write({ os_id: osIds.filter((item) => item !== id) }),
    })),
    ...architectures.map((id) => ({
      key: `arch-${id}`,
      label: id,
      onRemove: () => write({ architectures: architectures.filter((item) => item !== id) }),
    })),
  ];

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={tResults('errorTitle')}
        description={error}
        action={
          <Button variant="outline" onClick={reload}>
            {tResults('retry')}
          </Button>
        }
      />
    );
  }

  const meta = data.meta;

  return (
    <div className={cn('gap-6', showFilters ? 'lg:grid lg:grid-cols-[16rem_1fr]' : 'space-y-4')}>
      {showFilters ? (
        <>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="mt-1 text-sm font-medium text-primary lg:hidden"
            aria-expanded={filtersOpen}
          >
            {filtersOpen ? t('filtersHide') : t('filtersShow')}
          </button>

          <aside
            className={cn(
              'order-last lg:order-first lg:block',
              filtersOpen ? 'block' : 'hidden',
            )}
            aria-label={tResults('filtersLabel')}
          >
            <FilterPanel
              categories={categories}
              brands={brands}
              operatingSystems={operatingSystems}
              selectedCategories={categoryIds}
              selectedBrands={brandIds}
              selectedSystems={osIds}
              selectedArchitectures={architectures}
              favoritesOnly={favoritesOnly}
              onChange={{
                categories: (next) => write({ category_id: next }),
                brands: (next) => write({ brand_id: next }),
                operatingSystems: (next) => write({ os_id: next }),
                architectures: (next) => write({ architectures: next }),
                favoritesOnly: (next) => write({ is_favorite: next ? 'true' : null }),
              }}
            />
          </aside>
        </>
      ) : null}

      <div className="min-w-0 space-y-4">
        <ResultsToolbar
          total={meta?.total ?? data.items.length}
          order={order}
          perPage={perPage}
          view={view}
          loading={loading}
          filtersOpen={filtersOpen}
          onOrderChange={(next) => write({ order: next === 'recent' ? null : next })}
          onPerPageChange={(next) => write({ per_page: next === DEFAULT_PER_PAGE ? null : next })}
          onViewChange={changeView}
          onToggleFilters={showFilters ? () => setFiltersOpen((open) => !open) : undefined}
        />

        {chips.length > 0 ? (
          <ActiveFilters
            chips={chips}
            onClearAll={() =>
              clearAll(lockedQuery ? Object.keys(lockedQuery).map(String) : ['q'])
            }
          />
        ) : null}

        <FileGrid
          files={data.items}
          loading={loading}
          view={view}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          onFavoriteChanged={handleFavoriteChanged}
        />

        {meta ? (
          <Pagination page={meta.page} pages={meta.pages} onGo={(next) => write({ page: next }, true)} />
        ) : null}
      </div>
    </div>
  );
}

/** Multi-value query keys are comma-joined, so expand them back into arrays. */
function flatten(tree: CategoryRead[]): { id: string; name: string }[] {
  return tree.flatMap((node) => [
    { id: node.id, name: node.name },
    ...flatten(node.children ?? []),
  ]);
}

const PER_PAGE = new Set<number>([...PER_PAGE_OPTIONS]);

function readPerPage(value: string): number {
  const parsed = toPositiveInt(value, DEFAULT_PER_PAGE);
  return PER_PAGE.has(parsed) ? parsed : DEFAULT_PER_PAGE;
}
