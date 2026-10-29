import { getTranslations } from 'next-intl/server';

import { AdminFilesTable } from '@/components/admin/admin-files-table';
import { getServerApi } from '@/lib/api/server';
import { loadTaxonomy } from '@/lib/api/taxonomy';
import { requireAdmin } from '@/lib/auth/session';
import type { FileListItem, PageMeta } from '@/lib/api/types';

export async function generateMetadata() {
  const t = await getTranslations('admin.files');
  return { title: t('title') };
}

const PER_PAGE = 25;

export default async function AdminFilesPage() {
  await requireAdmin();
  const api = await getServerApi();
  const taxonomy = await loadTaxonomy();

  let initialFiles: FileListItem[] = [];
  let initialMeta: PageMeta | null = null;
  try {
    const res = await api.files.list({ order: 'recent', page: 1, per_page: PER_PAGE });
    initialFiles = res.data ?? [];
    initialMeta = res.meta ?? null;
  } catch (error) {
    console.error('[admin/files] initial load failed:', error);
  }

  return (
    <AdminFilesTable
      categories={taxonomy.categories}
      brands={taxonomy.brands}
      operatingSystems={taxonomy.operatingSystems}
      initialFiles={initialFiles}
      initialMeta={initialMeta}
    />
  );
}
