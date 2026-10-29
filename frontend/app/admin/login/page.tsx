import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { LoginForm } from '@/components/admin/login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { getSessionUser } from '@/lib/auth/session';

/** The sign-in screen checks for an existing session, so it is request-time. */
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('admin.auth');
  return { title: t('loginTitle') };
}

/**
 * Public sign-in lives outside the guarded admin group so it never redirects to
 * itself. An already-authenticated admin is bounced straight to the dashboard.
 */
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user?.is_admin) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-sm rounded-lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
