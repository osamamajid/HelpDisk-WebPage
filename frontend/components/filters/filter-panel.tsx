'use client';

import { ChevronRight, Folder } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { FilterChecklist } from '@/components/filters/filter-checklist';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { BrandRead, CategoryRead, OSRead } from '@/lib/api/types';
import { ARCHITECTURES } from '@/lib/constants';
import { flattenCategories } from '@/lib/category-tree';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  categories: CategoryRead[];
  brands: BrandRead[];
  operatingSystems: OSRead[];
  selectedCategories: string[];
  selectedBrands: string[];
  selectedSystems: string[];
  selectedArchitectures: string[];
  favoritesOnly: boolean;
  onChange: {
    categories: (next: string[]) => void;
    brands: (next: string[]) => void;
    operatingSystems: (next: string[]) => void;
    architectures: (next: string[]) => void;
    favoritesOnly: (next: boolean) => void;
  };
  className?: string;
}

/**
 * Facet panel for browsing. It is fully controlled by the URL, so every change
 * produces a shareable query string and the server response matches what is
 * displayed on reload.
 */
export function FilterPanel({
  categories,
  brands,
  operatingSystems,
  selectedCategories,
  selectedBrands,
  selectedSystems,
  selectedArchitectures,
  favoritesOnly,
  onChange,
  className,
}: FilterPanelProps) {
  const t = useTranslations('file.filters');
  const flat = React.useMemo(() => flattenCategories(categories), [categories]);

  // Count the active selections folded away behind "More filters" so the closed
  // summary still tells the user something is applied.
  const moreCount =
    selectedBrands.length + selectedSystems.length + selectedArchitectures.length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
      </div>

      {/* Categories keep their hierarchy, so they get an indented list rather
          than the flat checklist used by the other facets. */}
      {flat.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-medium">{t('categories')}</h3>
          <ul className="max-h-72 space-y-1 overflow-y-auto pe-1">
            {flat.map((item) => {
              const checked = selectedCategories.includes(item.id);
              const id = `cat-${item.id}`;
              const Icon = item.depth === 0 ? Folder : null;

              return (
                <li key={item.id} style={{ paddingInlineStart: `${item.depth * 0.85}rem` }}>
                  <Label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        onChange.categories(
                          checked
                            ? selectedCategories.filter((value) => value !== item.id)
                            : [...selectedCategories, item.id],
                        )
                      }
                    />
                    {Icon ? <Icon className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                    <span className="min-w-0 flex-1 truncate" title={item.path}>
                      {item.name}
                    </span>
                  </Label>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Brands, systems and architectures fold into one disclosure. */}
      <details className="disclosure group">
        <summary className="flex list-none items-center justify-between gap-2 text-sm font-medium">
          <span className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
            {t('moreFilters')}
          </span>
          {moreCount > 0 ? (
            <span className="rounded-full bg-primary-muted px-1.5 text-2xs font-semibold text-primary">
              {moreCount}
            </span>
          ) : null}
        </summary>

        <div className="mt-2 space-y-4 ps-5">
          <FilterChecklist
            collapsible={false}
            title={t('brands')}
            options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
            selected={selectedBrands}
            onChange={onChange.brands}
          />

          <FilterChecklist
            collapsible={false}
            title={t('operatingSystems')}
            options={operatingSystems.map((os) => ({ value: os.id, label: os.name }))}
            selected={selectedSystems}
            onChange={onChange.operatingSystems}
          />

          <FilterChecklist
            collapsible={false}
            title={t('architectures')}
            options={ARCHITECTURES.map((arch) => ({ value: arch, label: arch }))}
            selected={selectedArchitectures}
            onChange={onChange.architectures}
            searchThreshold={ARCHITECTURES.length}
          />
        </div>
      </details>

      <section>
        <Label
          htmlFor="favorites-only"
          className="surface flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium"
        >
          <Checkbox
            id="favorites-only"
            checked={favoritesOnly}
            onCheckedChange={(value) => onChange.favoritesOnly(value === true)}
          />
          {t('favoritesOnly')}
        </Label>
      </section>
    </div>
  );
}
