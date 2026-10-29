import { redirect } from 'next/navigation';

/** `/admin` has no dashboard of its own; send it to the first admin section. */
export default function AdminIndexRedirect() {
  redirect('/admin/dashboard');
}
