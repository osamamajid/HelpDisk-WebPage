'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/browser';
import { ApiError } from '@/lib/api/http';
import { cn } from '@/lib/utils';

interface FavoriteToggleProps {
  fileId: string;
  initialFavorite: boolean;
  /** Compact renders an icon-only button for table rows. */
  variant?: 'icon' | 'outline';
  className?: string;
  /** Called after a successful server mutation so the parent list can reload. */
  onFavoriteChanged?: () => void;
}

/**
 * Favouriting is a global flag on the record (this is a single-operator
 * library), so the toggle is optimistic and simply reverts on failure.
 */
export function FavoriteToggle({
  fileId,
  initialFavorite,
  variant = 'icon',
  className,
  onFavoriteChanged,
}: FavoriteToggleProps) {
  const t = useTranslations('file.favorite');
  const [favorite, setFavorite] = React.useState(initialFavorite);
  const [pending, setPending] = React.useState(false);

  // Reflect server truth if the row re-renders with new data.
  React.useEffect(() => setFavorite(initialFavorite), [initialFavorite]);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const next = !favorite;
    setFavorite(next);
    setPending(true);
    try {
      await api.files.setFavorite(fileId, next);
      toast.success(next ? t('added') : t('removed'));
      // Refresh the surrounding list only once the server has confirmed.
      onFavoriteChanged?.();
    } catch (error) {
      setFavorite(!next);
      toast.error(error instanceof ApiError ? error.message : t('failed'));
    } finally {
      setPending(false);
    }
  }

  const icon = (
    <Star
      className={cn(
        'size-4 transition-colors',
        favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
      )}
    />
  );

  return (
    <Button
      type="button"
      variant={variant === 'icon' ? 'ghost' : 'outline'}
      size={variant === 'icon' ? 'icon-sm' : 'sm'}
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorite}
      aria-label={favorite ? t('remove') : t('add')}
      title={favorite ? t('remove') : t('add')}
      className={className}
    >
      {icon}
      {variant === 'outline' ? <span>{favorite ? t('starred') : t('add')}</span> : null}
    </Button>
  );
}
