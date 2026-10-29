'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** Small shared CTA so error and empty states all offer the same way back. */
export function HomeLink({ label }: { label?: string }) {
  const t = useTranslations('errors');

  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/">
        <Home />
        {label ?? t('backHome')}
      </Link>
    </Button>
  );
}
