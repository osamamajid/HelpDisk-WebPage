import { getTranslations } from 'next-intl/server';

import { TaxonomyManager } from '@/components/admin/taxonomy-manager';
import { getServerApi } from '@/lib/api/server';
import { requireAdmin } from '@/lib/auth/session';
import type { TagRead } from '@/lib/api/types';

export async function generateMetadata() {
  const t = await getTranslations('admin.entity');
  return { title: t('tags') };
}

export default async function AdminTagsPage() {
  await requireAdmin();
  const t = await getTranslations('admin.entity');
  const api = await getServerApi();

  let tags: TagRead[] = [];
  try {
    tags = await api.tags.list();
  } catch (error) {
    console.error('[admin/tags] load failed:', error);
  }

  return (
    <TaxonomyManager
      entityKey="tags"
      initial={tags}
      title={t('tags')}
      description={t('tagsDesc')}
    />
  );
}
