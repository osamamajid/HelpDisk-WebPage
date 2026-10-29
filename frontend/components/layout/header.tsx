'use client';

import { HardDrive, Menu, Settings2, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { SearchForm } from '@/components/layout/search-form';
import { SiteNav } from '@/components/layout/site-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { PRIMARY_NAV } from '@/lib/constants';
import type { UserRead } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user: UserRead | null;
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations('nav');
  const c = useTranslations('common');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          aria-label={c('appName')}
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardDrive className="size-4" aria-hidden />
          </span>
          <span className="hidden text-sm sm:inline">{c('appName')}</span>
        </Link>

        <SiteNav items={PRIMARY_NAV} className="hidden lg:flex" />

        {/* One right cluster: search + account, with locale/theme reserved for large screens. */}
        <div className="ms-auto flex items-center gap-2">
          <div className="hidden w-full max-w-sm md:block">
            <SearchForm />
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          {user?.is_admin ? (
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/admin/dashboard">
                <Settings2 className="size-4" />
                <span className="hidden sm:inline">{t('adminArea')}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/login">{t('login')}</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t('menu')}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer: nav + search + the locale/theme controls moved out of the bar. */}
      <div
        className={cn(
          'grid overflow-hidden border-t transition-[grid-template-rows] duration-200 lg:hidden',
          mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] border-transparent',
        )}
      >
        <div className="min-h-0">
          <div className="container space-y-3 py-4">
            <SearchForm />
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <SiteNav
              items={PRIMARY_NAV}
              orientation="vertical"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
