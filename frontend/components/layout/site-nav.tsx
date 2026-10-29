'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/constants';

interface SiteNavProps {
  items: NavItem[];
  /** Namespace inside the `nav` messages to resolve each item key from. */
  namespace?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onNavigate?: () => void;
}

export function SiteNav({
  items,
  namespace = 'public',
  orientation = 'horizontal',
  className,
  onNavigate,
}: SiteNavProps) {
  const pathname = usePathname();
  const t = useTranslations(`nav.${namespace}`);

  return (
    <nav
      aria-label={namespace}
      className={cn(
        orientation === 'horizontal' ? 'flex items-center gap-1' : 'flex flex-col gap-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md text-sm font-medium transition-colors',
              orientation === 'horizontal' ? 'px-3 py-2' : 'px-3 py-2',
              active
                ? 'bg-primary-muted text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
