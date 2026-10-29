'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  fileId: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Hits the backend download route directly. That endpoint is public, counts the
 * download itself and either streams the file or 302s to nginx, so the browser
 * handles the transfer and no blob ever reaches React memory.
 */
export function DownloadButton({
  fileId,
  size = 'default',
  fullWidth = false,
  className,
}: DownloadButtonProps) {
  const t = useTranslations('file.download');

  return (
    <Button
      asChild
      size={size}
      variant={size === 'sm' ? 'outline' : 'default'}
      className={cn(fullWidth && 'w-full', className)}
    >
      <a
        href={api.files.downloadUrl(fileId)}
        download
        aria-label={t('label')}
        rel="noopener"
      >
        <Download />
        {t('label')}
      </a>
    </Button>
  );
}
