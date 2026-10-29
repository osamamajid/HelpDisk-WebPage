import type { Metadata } from 'next';
import { AlertTriangle, CalendarDays, Cpu, Download, FileText, HardDrive, Layers, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import * as React from 'react';

import { FileActions } from '@/components/file/file-actions';
import { FileKindIcon } from '@/components/file/file-kind-icon';
import { FileStrip } from '@/components/file/file-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getServerApi } from '@/lib/api/server';
import { ApiError } from '@/lib/api/http';
import type { FileRead } from '@/lib/api/types';
import { categoryIcon, toneForValue } from '@/lib/icons';
import { formatBytes, formatCount, formatDate } from '@/lib/utils';

interface FilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FilePageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('file');
  const api = await getServerApi();

  try {
    const file = await api.files.get(id);
    return { title: file.name, description: file.description ?? t('metaFallback') };
  } catch {
    return { title: t('metaFallback') };
  }
}

/** Detail route: everything except the action cluster renders on the server. */
export default async function FileDetailPage({ params }: FilePageProps) {
  const { id } = await params;
  const t = await getTranslations('file');
  const api = await getServerApi();

  let file: FileRead;
  try {
    file = await api.files.get(id);
  } catch (error) {
    // Genuine 404: the file does not exist in the library.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    // Rate limited: show a retryable message, NOT a 404.
    if (error instanceof ApiError && error.status === 429) {
      return (
        <div className="container py-16 text-center">
          <AlertTriangle className="mx-auto mb-4 size-10 text-amber-500" />
          <h1 className="text-lg font-semibold">{t('rateLimitedTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('rateLimitedDesc')}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/">{t('backHome')}</Link>
          </Button>
        </div>
      );
    }
    // Unexpected error (5xx, network): log and show generic error.
    console.error('[file] load failed:', error);
    return (
      <div className="container py-16 text-center">
        <AlertTriangle className="mx-auto mb-4 size-10 text-destructive" />
        <h1 className="text-lg font-semibold">{t('loadErrorTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('loadErrorDesc')}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">{t('backHome')}</Link>
        </Button>
      </div>
    );
  }

  const related = file.category
    ? await api.files
        .list({ category_id: [file.category.id], per_page: 7 })
        .then((res) => (res.data ?? []).filter((item) => item.id !== file.id).slice(0, 6))
        .catch(() => [] as FileRead[])
    : ([] as FileRead[]);
  const CategoryIcon = categoryIcon(file.category?.icon);

  return (
    <div className="container py-8">
      <nav aria-label={t('breadcrumb')} className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t('crumbs.home')}
        </Link>
        {file.category ? (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/search?category_id=${file.category.id}`}
              className="hover:text-foreground"
            >
              {file.category.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="truncate text-foreground">{file.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <header className="flex items-start gap-4">
            <FileKindIcon extension={file.extension} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-balance">{file.name}</h1>
              <p className="mt-1 truncate text-sm text-muted-foreground bidi-safe" dir="ltr">
                {file.original_filename}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {file.category ? (
                  <Badge
                    asChild
                    variant="outline"
                    className={toneForValue(file.category.color ?? file.category.name)}
                  >
                    <Link href={`/search?category_id=${file.category.id}`}>
                      <CategoryIcon className="size-3" />
                      {file.category.name}
                    </Link>
                  </Badge>
                ) : null}
                {file.brand ? (
                  <Badge asChild variant="secondary">
                    <Link href={`/search?brand_id=${file.brand.id}`}>{file.brand.name}</Link>
                  </Badge>
                ) : null}
                {file.version ? (
                  <Badge variant="muted" className="bidi-safe" dir="ltr">
                    v{file.version}
                  </Badge>
                ) : null}
              </div>
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('descriptionTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {file.description || t('noDescription')}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Cpu className="size-4" />
                  {t('compatibility')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {t('operatingSystems')}
                  </p>
                  {file.operating_systems.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {file.operating_systems.map((os) => (
                        <li key={os.id}>
                          <Badge
                            asChild
                            variant="outline"
                            className="font-normal"
                          >
                            <Link href={`/search?os_id=${os.id}`}>{os.name}</Link>
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">{t('notSpecified')}</p>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {t('architectures')}
                  </p>
                  {file.architectures.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {file.architectures.map((arch) => (
                        <li key={arch}>
                          <Badge
                            asChild
                            variant="muted"
                            className="bidi-safe font-mono font-normal"
                          >
                            <Link href={`/search?architectures=${encodeURIComponent(arch)}`}>
                              {arch}
                            </Link>
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">{t('notSpecified')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="size-4" />
                  {t('details')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <DetailRow icon={HardDrive} label={t('size')} value={formatBytes(file.file_size)} />
                  <DetailRow icon={FileText} label={t('mimeType')} value={file.mime_type} />
                  <DetailRow icon={Download} label={t('downloads')} value={formatCount(file.download_count)} />
                  <DetailRow
                    icon={CalendarDays}
                    label={t('added')}
                    value={formatDate(file.created_at)}
                  />
                  {file.last_downloaded_at ? (
                    <DetailRow
                      icon={Download}
                      label={t('lastDownload')}
                      value={formatDate(file.last_downloaded_at)}
                    />
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </div>

          {file.tags.length > 0 ? (
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <TagIcon className="size-4" />
                {t('tags')}
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {file.tags.map((tag) => (
                  <li key={tag.id}>
                    <Badge asChild variant="outline" className="font-normal">
                      <Link href={`/search?q=${encodeURIComponent(tag.name)}`}>{tag.name}</Link>
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {related.length > 0 ? (
            <FileStrip
              title={t('related')}
              files={related}
              href={`/search?category_id=${file.category?.id ?? ''}`}
              linkLabel={t('viewAll')}
            />
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-3 p-5">
              <FileActions fileId={file.id} initialFavorite={file.is_favorite} />
              <p className="text-center text-2xs text-muted-foreground">
                {t('downloadHint')}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="truncate text-end font-medium bidi-safe" dir="ltr">
        {value}
      </dd>
    </div>
  );
}
