import { getServerApi } from '@/lib/api/server';
import type { BrandRead, CategoryRead, OSRead } from '@/lib/api/types';

export interface Taxonomy {
  categories: CategoryRead[];
  brands: BrandRead[];
  operatingSystems: OSRead[];
}

/**
 * Facet sources for the browsing pages. The library itself is still browsable
 * when a taxonomy call fails, so every part degrades to an empty list rather
 * than taking the route down.
 */
export async function loadTaxonomy(): Promise<Taxonomy> {
  const api = await getServerApi();
  const [categories, brands, operatingSystems] = await Promise.all([
    safe(() => api.categories.list(), [] as CategoryRead[]),
    safe(() => api.brands.list(), [] as BrandRead[]),
    safe(() => api.operatingSystems.list(), [] as OSRead[]),
  ]);
  return { categories, brands, operatingSystems };
}

async function safe<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error('[taxonomy] load failed:', error);
    return fallback;
  }
}
