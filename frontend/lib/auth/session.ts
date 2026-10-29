/**
 * Server-side session helpers.
 *
 * The backend has no session store: the access token is a JWT kept in an
 * httpOnly cookie, so "am I logged in" means "does /auth/me accept this token".
 * `cache()` dedupes that call across all components in one render pass.
 */
import { cache } from 'react';
import { redirect } from 'next/navigation';

import { ApiError } from '@/lib/api/http';
import { getServerApi } from '@/lib/api/server';
import type { UserRead } from '@/lib/api/types';
import { LOGIN_PATH } from '@/lib/constants';

/** Current user, or null when there is no valid session. */
export const getSessionUser = cache(async (): Promise<UserRead | null> => {
  try {
    const api = await getServerApi();
    return await api.auth.me();
  } catch (error) {
    // 401/403 simply means "anonymous"; anything else is a real outage.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    console.error('[session] failed to resolve user:', error);
    return null;
  }
});

/** Admin-only guard for pages: redirects to the login screen. */
export async function requireAdmin(returnTo?: string): Promise<UserRead> {
  const user = await getSessionUser();
  if (!user) {
    redirect(returnTo ? `${LOGIN_PATH}?next=${encodeURIComponent(returnTo)}` : LOGIN_PATH);
  }
  if (!user.is_admin) {
    redirect('/');
  }
  return user;
}

/** True when the request carries an admin session, without redirecting. */
export async function isAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return Boolean(user?.is_admin);
}
