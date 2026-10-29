import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { clearSessionCookies } from '@/lib/auth/cookies';

/**
 * Clears the first-party session. The backend's own logout only deletes its
 * cookie on its origin, which the browser does not send here, so clearing our
 * side is what actually ends the session for this app.
 */
export async function POST() {
  const store = await cookies();
  clearSessionCookies(store);

  return NextResponse.json(
    { success: true, message: 'Logged out' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
