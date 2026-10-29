import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { DownloadButton } from '@/components/file/download-button';
import { FavoriteToggle } from '@/components/file/favorite-toggle';
import { FileKindIcon } from '@/components/file/file-kind-icon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { FileListItem } from '@/lib/api/types';
import { categoryIcon, toneForValue } from '@/lib/icons';
import { cn, formatBytes, formatCount, formatDate } from '@/lib/utils';

interface FileCardProps {
  file: FileListItem;
  className?: string;
  /** Called after a successful favorite toggle so the list can reload. */
  onFavoriteChanged?: () => void;
}

/**
 * Results card. Rendered on the server, with only the two interactive children
 * (favourite / download) crossing into the client bundle.
 */
export function FileCard({ file, className, onFavoriteChanged }: FileCardProps) {
  const t = useTranslations('file');
  const CategoryIcon = categoryIcon(file.category?.icon);

  return (
    <Card
      className={cn(
        'card-hover group relative flex flex-col gap-3 p-4 transition-shadow',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <FileKindIcon extension={file.extension} />

        <div className="min-w-0 flex-1">
          {/* Stretched link keeps the whole card clickable without nesting anchors. */}
          <h3 className="truncate text-sm font-semibold leading-tight">
            <Link
              href={`/file/${file.id}`}
              className="after:absolute after:inset-0 after:content-[''] hover:underline"
              scroll={false}
            >
              {file.name}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground bidi-safe" dir="ltr">
            {file.original_filename}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1">
          <FavoriteToggle
            fileId={file.id}
            initialFavorite={file.is_favorite}
            onFavoriteChanged={onFavoriteChanged}
          />
        </div>
      </div>

      <p className="line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
        {file.description || t('noDescription')}
      </p>

      {/* Only the category chip survives on the card; brand/arch/OS stay on the detail page. */}
      {file.category ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn('gap-1 border-transparent', toneForValue(file.category.color ?? file.category.name))}
          >
            <CategoryIcon className="size-3" />
            {file.category.name}
          </Badge>
        </div>
      ) : null}

      {/* Single quiet meta line in place of the bordered, icon-heavy footer. */}
      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="bidi-safe truncate" dir="ltr">
          {formatBytes(file.file_size)}
          <span aria-hidden className="px-1.5">·</span>
          {formatCount(file.download_count)}
          <span aria-hidden className="hidden px-1.5 sm:inline">·</span>
          <span className="hidden sm:inline">{formatDate(file.created_at)}</span>
        </p>

        {/* Above the stretched link so it stays clickable. */}
        <div className="relative z-10">
          <DownloadButton fileId={file.id} size="sm" />
        </div>
      </div>
    </Card>
  );
}
