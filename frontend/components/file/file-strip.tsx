import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { FileCard } from '@/components/file/file-card';
import type { FileListItem } from '@/lib/api/types';
import { categoryIcon, toneForValue } from '@/lib/icons';
import { cn } from '@/lib/utils';

/**
 * Server-rendered strip of cards used on the home page. Unlike the browsing
 * grid it owns no state: it is a snapshot that links into /search.
 */
interface FileStripProps {
  title: string;
  files: FileListItem[];
  /** Optional "view all" target. */
  href?: string;
  linkLabel?: string;
  emptyLabel?: string;
  className?: string;
}

export function FileStrip({
  title,
  files,
  href,
  linkLabel,
  emptyLabel,
  className,
}: FileStripProps) {
  return (
    <section className={cn('space-y-3', className)} aria-labelledby={slug(title)}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={slug(title)} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        {href && linkLabel ? (
          <Link href={href} className="text-xs font-medium text-primary hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>

      {files.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </section>
  );
}

function slug(value: string): string {
  return `strip-${value.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
}

/** Horizontal list of top-level categories used as the home page launcher. */
interface CategoryGridProps {
  categories: { id: string; name: string; icon: string | null; color: string | null; children?: unknown[] }[];
  basePath?: string;
  emptyLabel?: string;
}

export function CategoryGrid({ categories, basePath = '/search', emptyLabel }: CategoryGridProps) {
  const t = useTranslations('home');

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const Icon = categoryIcon(category.icon);
        const count = category.children?.length ?? 0;

        return (
          <li key={category.id}>
            <Link
              href={`${basePath}?category_id=${category.id}`}
              className="surface group flex h-full items-center gap-3 p-3 text-sm transition-colors hover:bg-muted/70"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md',
                  toneForValue(category.color ?? category.name),
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{category.name}</span>
                {count > 0 ? (
                  <span className="block text-2xs text-muted-foreground">
                    {t('subcategories', { count })}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
