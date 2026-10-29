'use client';

import { Link2, PencilLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { DownloadButton } from '@/components/file/download-button';
import { FavoriteToggle } from '@/components/file/favorite-toggle';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/client-session';

interface FileActionsProps {
  fileId: string;
  initialFavorite: boolean;
  className?: string;
}

/** Download / favourite / copy-link cluster on the detail page. */
export function FileActions({ fileId, initialFavorite, className }: FileActionsProps) {
  const t = useTranslations('file.actions');
  const [admin, setAdmin] = React.useState(false);

  // Cheap check so the edit affordance is not shown to anonymous visitors.
  React.useEffect(() => {
    let active = true;
    isAdmin().then((value) => {
      if (active) setAdmin(value);
    });
    return () => {
      active = false;
    };
  }, []);

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('linkCopyFailed'));
    }
  }

  return (
    <div className={className}>
      <DownloadButton fileId={fileId} size="lg" fullWidth />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <FavoriteToggle
          fileId={fileId}
          initialFavorite={initialFavorite}
          variant="outline"
        />
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Link2 />
          {t('copyLink')}
        </Button>
        {admin ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/files?edit=${fileId}`}>
              <PencilLine />
              {t('edit')}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
