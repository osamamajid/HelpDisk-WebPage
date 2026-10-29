import { getTranslations } from 'next-intl/server';

import { TaxonomyManager } from '@/components/admin/taxonomy-manager';
import { getServerApi } from '@/lib/api/server';
import { requireAdmin } from '@/lib/auth/session';
import type { OSRead } from '@/lib/api/types';

export async function generateMetadata() {
  const t = await getTranslations('admin.entity');
  return { title: t('operatingSystems') };
}

export default async function AdminOperatingSystemsPage() {
  await requireAdmin();
  const t = await getTranslations('admin.entity');
  const api = await getServerApi();

  let items: OSRead[] = [];
  try {
    items = await api.operatingSystems.list();
  } catch (error) {
    console.error('[admin/operating-systems] load failed:', error);
  }

  return (
    <TaxonomyManager
      entityKey="operatingSystems"
      initial={items}
      title={t('operatingSystems')}
      description={t('operatingSystemsDesc')}
    />
  );
}
