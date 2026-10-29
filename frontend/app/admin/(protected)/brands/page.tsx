import { getTranslations } from 'next-intl/server';

import { TaxonomyManager } from '@/components/admin/taxonomy-manager';
import { getServerApi } from '@/lib/api/server';
import { requireAdmin } from '@/lib/auth/session';
import type { BrandRead } from '@/lib/api/types';

export async function generateMetadata() {
  const t = await getTranslations('admin.entity');
  return { title: t('brands') };
}

export default async function AdminBrandsPage() {
  await requireAdmin();
  const t = await getTranslations('admin.entity');
  const api = await getServerApi();

  let brands: BrandRead[] = [];
  try {
    brands = await api.brands.list();
  } catch (error) {
    console.error('[admin/brands] load failed:', error);
  }

  return (
    <TaxonomyManager
      entityKey="brands"
      initial={brands}
      title={t('brands')}
      description={t('brandsDesc')}
    />
  );
}
