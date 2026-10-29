'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { FileCard } from '@/components/file/file-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { FileListItem } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface FileGridProps {
  files: FileListItem[];
  loading: boolean;
  view?: 'grid' | 'list';
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  action?: React.ReactNode;
  className?: string;
  /** Called after a successful favorite toggle so the parent can reload. */
  onFavoriteChanged?: () => void;
}

const SKELETON_CARD = 'h-44 rounded-lg';

/** Results grid. Keeps its own skeleton so filter changes never flash a blank. */
export function FileGrid({
  files,
  loading,
  view = 'grid',
  skeletonCount = 9,
  emptyTitle,
  emptyDescription,
  action,
  className,
  onFavoriteChanged,
}: FileGridProps) {
  const t = useTranslations('file.results');

  if (loading && files.length === 0) {
    return (
      <div
        className={cn(
          'grid gap-3',
          view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1',
          className,
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton key={index} className={SKELETON_CARD} />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle ?? t('emptyTitle')}
        description={emptyDescription ?? t('emptyDescription')}
        action={action}
      />
    );
  }

  return (
    <div
      className={cn(
        'grid gap-3',
        view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1',
        className,
      )}
    >
      {files.map((file) => (
        <FileCard key={file.id} file={file} onFavoriteChanged={onFavoriteChanged} />
      ))}
    </div>
  );
}
