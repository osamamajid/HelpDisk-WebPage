/**
 * Client-side session helper.
 *
 * Pages already resolve the user on the server (lib/auth/session.ts); this is
 * only for islands that mount outside a server-rendered value, e.g. the detail
 * page action cluster. The proxy attaches the httpOnly cookie automatically,
 * so a 401 simply means "anonymous" and must not be surfaced as an error.
 */
import { api } from '@/lib/api/browser';
import { ApiError } from '@/lib/api/http';
import type { UserRead } from '@/lib/api/types';

export async function getClientUser(): Promise<UserRead | null> {
  try {
    return await api.auth.me();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    console.error('[session] client lookup failed:', error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getClientUser();
  return Boolean(user?.is_admin);
}
