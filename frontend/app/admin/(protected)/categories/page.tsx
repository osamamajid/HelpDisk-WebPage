import { getTranslations } from 'next-intl/server';

import { CategoryManager } from '@/components/admin/category-manager';
import { getServerApi } from '@/lib/api/server';
import { requireAdmin } from '@/lib/auth/session';
import type { CategoryRead } from '@/lib/api/types';

export async function generateMetadata() {
  const t = await getTranslations('admin.categories');
  return { title: t('title') };
}

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const api = await getServerApi();

  let categories: CategoryRead[] = [];
  try {
    categories = await api.categories.list();
  } catch (error) {
    console.error('[admin/categories] load failed:', error);
  }

  return <CategoryManager categories={categories} />;
}
