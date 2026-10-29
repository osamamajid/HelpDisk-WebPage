'use client';

import { KeyRound, Lock, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Posts credentials to the same-origin proxy route, which performs the backend
 * exchange and stores the JWT in an httpOnly cookie. The browser never handles
 * the token itself, so this form only needs to know success vs. failure.
 */
export function LoginForm() {
  const t = useTranslations('admin.auth');
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin/dashboard';

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) {
      toast.error(t('required'));
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const body = (await response.json().catch(() => null)) as { detail?: string } | null;

      if (!response.ok) {
        toast.error(body?.detail || t('invalid'));
        return;
      }

      toast.success(t('welcomeBack'));
      router.replace(next);
      router.refresh();
    } catch {
      toast.error(t('networkError'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">{t('loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">{t('username')}</Label>
            <div className="relative">
              <User className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="username"
                name="username"
                autoComplete="username"
                className="ps-8"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="ps-8"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" loading={pending}>
            {pending ? t('signingIn') : t('signIn')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
