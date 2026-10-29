'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { COOKIES } from '@/lib/constants';
import { dirFor, isLocale, localeOptions } from '@/lib/i18n/config';

/**
 * Locale picker. The choice is written to a cookie and the router refreshes the
 * server-rendered tree, because messages are resolved on the server.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common.locale');
  const [isPending, startTransition] = useTransition();

  const current = localeOptions.find((option) => option.value === locale) ?? localeOptions[0];

  function select(next: string) {
    if (!isLocale(next) || next === locale) return;

    startTransition(() => {
      try {
        document.cookie = `${COOKIES.locale}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        // Server components read messages per request, so the tree must re-render.
        router.replace(`${pathname}${window.location.search}`, { scroll: false });
      } catch (error) {
        toast.error(t('switchFailed'));
        console.error('[locale] switch failed', error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          aria-label={t('label')}
          disabled={isPending}
        >
          <Languages className="size-4" />
          <span className="uppercase">{current.value}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {localeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => select(option.value)}
            data-checked={option.value === locale}
            className={option.value === locale ? 'bg-accent font-medium' : undefined}
          >
            {/* Each entry renders in its own script and direction. */}
            <span dir={dirFor(option.value)}>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
