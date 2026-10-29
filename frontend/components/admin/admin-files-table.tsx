'use client';

import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/browser';
import { ApiError } from '@/lib/api/http';
import type {
  BrandRead,
  CategoryRead,
  FileListItem,
  FileUpdate,
  OSRead,
  PageMeta,
} from '@/lib/api/types';
import { flattenCategories } from '@/lib/category-tree';
import { ARCHITECTURES } from '@/lib/constants';

const NONE = '__none__';
const PER_PAGE = 25;

interface AdminFilesTableProps {
  categories: CategoryRead[];
  brands: BrandRead[];
  operatingSystems: OSRead[];
  initialFiles: FileListItem[];
  initialMeta: PageMeta | null;
}

interface EditState {
  id: string;
  name: string;
  description: string;
  category_id: string | null;
  brand_id: string | null;
  model: string;
  version: string;
  architectures: string[];
  operating_systems: string[];
  is_favorite: boolean;
}

function toEditState(file: FileListItem): EditState {
  return {
    id: file.id,
    name: file.name,
    description: file.description ?? '',
    category_id: file.category?.id ?? null,
    brand_id: file.brand?.id ?? null,
    model: file.model ?? '',
    version: file.version ?? '',
    architectures: [...file.architectures],
    operating_systems: file.operating_systems.map((os) => os.id),
    is_favorite: file.is_favorite,
  };
}

/**
 * Admin file manager: server-rendered first page, then client-side search,
 * inline metadata editing and guarded deletion. Rows keep their detail link so
 * an admin can preview exactly what an end user sees.
 */
export function AdminFilesTable({
  categories,
  brands,
  operatingSystems,
  initialFiles,
  initialMeta,
}: AdminFilesTableProps) {
  const t = useTranslations('admin.files');
  const common = useTranslations('admin.common');

  const flat = React.useMemo(() => flattenCategories(categories), [categories]);

  const [files, setFiles] = React.useState<FileListItem[]>(initialFiles);
  const [meta, setMeta] = React.useState<PageMeta | null>(initialMeta);
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<EditState | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<FileListItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function load(targetPage: number, search: string) {
    setLoading(true);
    try {
      const res = await api.files.list({
        q: search || undefined,
        order: 'recent',
        page: targetPage,
        per_page: PER_PAGE,
      });
      setFiles(res.data ?? []);
      setMeta(res.meta ?? null);
      setPage(targetPage);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : common('failed'));
    } finally {
      setLoading(false);
    }
  }

  function runSearch(event: React.FormEvent) {
    event.preventDefault();
    load(1, query.trim());
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: FileUpdate = {
        name: editing.name.trim(),
        description: editing.description.trim() || undefined,
        category_id: editing.category_id,
        brand_id: editing.brand_id,
        model: editing.model.trim() || undefined,
        version: editing.version.trim() || undefined,
        architectures: editing.architectures,
        operating_systems: editing.operating_systems,
        is_favorite: editing.is_favorite,
      };
      const updated = await api.files.update(editing.id, payload);
      setFiles((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
      setEditing(null);
      toast.success(common('saved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : common('failed'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.files.remove(toDelete.id);
      setFiles((prev) => prev.filter((row) => row.id !== toDelete.id));
      toast.success(common('deleted'));
      setToDelete(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : common('failed'));
    } finally {
      setDeleting(false);
    }
  }

  const pages = meta?.pages ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/upload">
              <Plus />
              {t('uploadNew')}
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={runSearch} className="flex items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-8"
            aria-label={common('search')}
          />
        </div>
        <Button type="submit" variant="outline" loading={loading}>
          {common('search')}
        </Button>
      </form>

      <Card>
        <CardContent className="pt-5">
          {files.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              {t('empty')}
            </p>
          ) : (
            <Table className="scrollbar-thin">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('category')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('downloads')}</TableHead>
                  <TableHead className="text-end">{common('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="max-w-[18rem]">
                      <div className="flex items-center gap-1.5">
                        {file.is_favorite ? (
                          <Star className="size-3.5 shrink-0 fill-current text-warning" aria-hidden />
                        ) : null}
                        <Link
                          href={`/file/${file.id}`}
                          className="min-w-0 truncate font-medium hover:underline"
                        >
                          {file.name}
                        </Link>
                      </div>
                      <p className="truncate text-xs text-muted-foreground bidi-safe" dir="ltr">
                        {file.original_filename}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {file.category ? <Badge variant="outline">{file.category.name}</Badge> : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell bidi-safe" dir="ltr">
                      {file.download_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditing(toEditState(file))}
                          aria-label={common('edit')}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setToDelete(file)}
                          aria-label={common('delete')}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {t('pageOf', { page, pages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => load(page - 1, query.trim())}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || loading}
              onClick={() => load(page + 1, query.trim())}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={editing !== null} onOpenChange={(next) => !next && !saving && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
            <DialogDescription>{t('editHint')}</DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="f-name">{t('name')}</Label>
                <Input
                  id="f-name"
                  value={editing.name}
                  onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                  maxLength={255}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-desc">{t('descriptionField')}</Label>
                <Textarea
                  id="f-desc"
                  rows={3}
                  value={editing.description}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f-cat">{t('category')}</Label>
                  <Select
                    value={editing.category_id ?? NONE}
                    onValueChange={(value) =>
                      setEditing({ ...editing, category_id: value === NONE ? null : value })
                    }
                  >
                    <SelectTrigger id="f-cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('uncategorized')}</SelectItem>
                      {flat.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-brand">{t('brand')}</Label>
                  <Select
                    value={editing.brand_id ?? NONE}
                    onValueChange={(value) =>
                      setEditing({ ...editing, brand_id: value === NONE ? null : value })
                    }
                  >
                    <SelectTrigger id="f-brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('noBrand')}</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f-model">{t('model')}</Label>
                  <Input
                    id="f-model"
                    value={editing.model}
                    onChange={(event) => setEditing({ ...editing, model: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-version">{t('versionField')}</Label>
                  <Input
                    id="f-version"
                    value={editing.version}
                    onChange={(event) => setEditing({ ...editing, version: event.target.value })}
                    maxLength={64}
                  />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t('architectures')}</legend>
                <div className="flex flex-wrap gap-4">
                  {ARCHITECTURES.map((arch) => {
                    const checked = editing.architectures.includes(arch);
                    return (
                      <Label key={arch} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setEditing({
                              ...editing,
                              architectures:
                                value === true
                                  ? [...editing.architectures, arch]
                                  : editing.architectures.filter((a) => a !== arch),
                            })
                          }
                        />
                        <span className="bidi-safe font-mono" dir="ltr">
                          {arch}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              </fieldset>

              {operatingSystems.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{t('operatingSystems')}</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {operatingSystems.map((os) => {
                      const checked = editing.operating_systems.includes(os.id);
                      return (
                        <Label key={os.id} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setEditing({
                                ...editing,
                                operating_systems:
                                  value === true
                                    ? [...editing.operating_systems, os.id]
                                    : editing.operating_systems.filter((id) => id !== os.id),
                              })
                            }
                          />
                          {os.name}
                        </Label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              <Label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={editing.is_favorite}
                  onCheckedChange={(value) => setEditing({ ...editing, is_favorite: value === true })}
                />
                {t('markFavorite')}
              </Label>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              {common('cancel')}
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              {common('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(next) => !next && setToDelete(null)}
        title={t('confirmTitle')}
        description={t('confirmBody', { name: toDelete?.name ?? '' })}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
