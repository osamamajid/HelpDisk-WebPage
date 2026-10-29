'use client';

import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/** sonner keeps its position union private; read it back off the component. */
type SonnerPosition = NonNullable<ComponentProps<typeof SonnerToaster>['position']>;

/**
 * Toast host. Sonner only understands physical positions, so the anchor side is
 * mirrored for RTL locales and themed off the active colour scheme.
 */
export function Toaster() {
  const { theme = 'system' } = useTheme();
  const locale = useLocale();
  const position: SonnerPosition = locale === 'ar' ? 'bottom-left' : 'bottom-right';

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position={position}
      closeButton
      richColors
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-popover text-popover-foreground border border-border shadow-lg rounded-lg',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
        },
      }}
    />
  );
}
