import {
  Boxes,
  CalendarClock,
  Database,
  Download,
  FolderTree,
  HardDrive,
  Star,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerApi } from '@/lib/api/server';
import { requireAdmin } from '@/lib/auth/session';
import type { CategoryStat, DashboardStatsFull } from '@/lib/api/types';
import { formatBytes, formatCount } from '@/lib/utils';

export async function generateMetadata() {
  const t = await getTranslations('admin.dashboard');
  return { title: t('title') };
}

export default async function DashboardPage() {
  await requireAdmin();
  const t = await getTranslations('admin.dashboard');
  const api = await getServerApi();

  let stats: DashboardStatsFull | null = null;
  try {
    stats = await api.dashboard.stats();
  } catch (error) {
    console.error('[dashboard] stats failed:', error);
  }

  if (!stats) {
    return (
      <div className="space-y-5">
        <AdminPageHeader icon={Boxes} title={t('title')} description={t('description')} />
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t('noData')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Boxes} title={t('title')} description={t('description')} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={HardDrive} label={t('totalFiles')} value={formatCount(stats.total_files)} />
        <StatCard icon={Download} label={t('totalDownloads')} value={formatCount(stats.total_downloads)} />
        <StatCard icon={FolderTree} label={t('categories')} value={formatCount(stats.total_categories)} />
        <StatCard icon={Database} label={t('storage')} value={formatBytes(stats.storage_used_bytes)} />
        <StatCard icon={Star} label={t('favorites')} value={formatCount(stats.favorite_files)} />
        <StatCard icon={CalendarClock} label={t('recent')} value={formatCount(stats.recent_files)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownList title={t('topCategories')} items={stats.top_categories} unitLabel={t('filesUnit')} />
        <BreakdownList title={t('topBrands')} items={stats.top_brands} unitLabel={t('filesUnit')} />
        <BreakdownList title={t('byOs')} items={stats.os_breakdown} unitLabel={t('filesUnit')} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('byArchitecture')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ArchitectureTable breakdown={stats.architecture_breakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BreakdownList({
  title,
  items,
  unitLabel,
}: {
  title: string;
  items: CategoryStat[];
  unitLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground bidi-safe" dir="ltr">
                  {formatCount(item.file_count)} {unitLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ArchitectureTable({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map(([arch, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li key={arch} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="bidi-safe font-mono" dir="ltr">
                {arch}
              </span>
              <span className="bidi-safe text-muted-foreground" dir="ltr">
                {formatCount(count)} · {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
