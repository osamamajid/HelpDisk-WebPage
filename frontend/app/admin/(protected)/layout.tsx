import { AdminShell } from '@/components/admin/admin-shell';
import { requireAdmin } from '@/lib/auth/session';

/** Every admin page resolves a session, so nothing here can be prerendered. */
export const dynamic = 'force-dynamic';

/**
 * Guards the whole admin group. `requireAdmin` redirects anonymous visitors to
 * the login screen (with a return path) and non-admins to the home page, so no
 * protected page has to repeat the check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
