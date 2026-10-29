import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import * as React from 'react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { getSessionUser } from '@/lib/auth/session';
import { siteUrl } from '@/lib/api/urls';
import { dirFor, isLocale } from '@/lib/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';

import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  const name = t('appName');

  return {
    metadataBase: siteUrl() ? new URL(siteUrl()) : undefined,
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: t('appDescription'),
    applicationName: name,
    other: {
      // Chrome on Windows otherwise rewrites the layout for "optimised" text.
      'x-dns-prefetch-control': 'off',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f131c' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  // getLocale is typed as string; narrow before it reaches `dir` and lang.
  const activeLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  // Resolved once for the whole tree and reused by every page below.
  const user = await getSessionUser();

  return (
    <html lang={activeLocale} dir={dirFor(activeLocale)} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <NextIntlClientProvider locale={activeLocale} messages={messages}>
          <ThemeProvider>
            <Header user={user} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
