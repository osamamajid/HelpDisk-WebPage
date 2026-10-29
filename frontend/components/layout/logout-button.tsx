'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

/** Ends the first-party session; the proxy route clears the httpOnly cookies. */
export function LogoutButton({ className }: { className?: string }) {
  const t = useTranslations('admin.auth');
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function signOut() {
    setPending(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success(t('loggedOut'));
      router.replace('/');
      router.refresh();
    } catch {
      toast.error(t('logoutFailed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={signOut}
      loading={pending}
      className={className}
    >
      <LogOut />
      {t('logout')}
    </Button>
  );
}
