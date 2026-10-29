import { getTranslations } from 'next-intl/server';

import { UploadForm } from '@/components/admin/upload-form';
import { loadTaxonomy } from '@/lib/api/taxonomy';
import { requireAdmin } from '@/lib/auth/session';

export async function generateMetadata() {
  const t = await getTranslations('admin.upload');
  return { title: t('title') };
}

export default async function AdminUploadPage() {
  await requireAdmin();
  const taxonomy = await loadTaxonomy();

  // The form owns its own page heading, so the shell adds nothing here.
  return <UploadForm categories={taxonomy.categories} brands={taxonomy.brands} operatingSystems={taxonomy.operatingSystems} />;
}
