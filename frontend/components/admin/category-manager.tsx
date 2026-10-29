'use client';

import { Folder, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/browser';
import { ApiError } from '@/lib/api/http';
import type { CategoryCreate, CategoryRead, CategoryUpdate } from '@/lib/api/types';
import { descendantIds, flattenCategories } from '@/lib/category-tree';
import { CATEGORY_ICONS, COLOR_TONES, categoryIcon, toneForValue } from '@/lib/icons';
import { cn } from '@/lib/utils';

const NONE = '__none__';

interface FormState {
  id?: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  description: string | null;
}

const EMPTY_FORM: FormState = {
  name: '',
  parent_id: null,
  icon: null,
  color: null,
  sort_order: 0,
  is_active: true,
  description: null,
};

function findNode(nodes: CategoryRead[], id: string): CategoryRead | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

/**
 * Hierarchical category editor. The tree is loaded on the server and refreshed
 * after every mutation with `router.refresh()`, so the client never has to
 * reconcile a nested structure by hand.
 */
export function CategoryManager({ categories }: { categories: CategoryRead[] }) {
  const t = useTranslations('admin.categories');
  const common = useTranslations('admin.common');
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<CategoryRead | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // When editing, a category cannot parent itself or any of its descendants.
  const parentOptions = React.useMemo(() => {
    const excludeId = form.id;
    const extra = new Set<string>();
    if (excludeId) {
      const node = findNode(categories, excludeId);
      if (node) for (const id of descendantIds(node)) extra.add(id);
    }
    return flattenCategories(categories, { excludeId }).filter(
      (item) => !extra.has(item.id),
    );
  }, [categories, form.id]);

  const flat = React.useMemo(() => flattenCategories(categories), [categories]);

  function openCreate(parent?: CategoryRead) {
    setForm({ ...EMPTY_FORM, parent_id: parent?.id ?? null });
    setOpen(true);
  }

  function openEdit(node: CategoryRead) {
    setForm({
      id: node.id,
      name: node.name,
      parent_id: node.parent_id ?? null,
      icon: node.icon ?? null,
      color: node.color ?? null,
      sort_order: node.sort_order ?? 0,
      is_active: node.is_active ?? true,
      description: node.description ?? null,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload: CategoryCreate & CategoryUpdate = {
        name: form.name.trim(),
        parent_id: form.parent_id,
        icon: form.icon,
        color: form.color,
        sort_order: form.sort_order,
        is_active: form.is_active,
        description: form.description?.trim() || null,
      };
      if (form.id) {
        await api.categories.update(form.id, payload);
        toast.success(common('saved'));
      } else {
        await api.categories.create(payload);
        toast.success(common('created'));
      }
      setOpen(false);
      router.refresh();
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
      await api.categories.remove(toDelete.id);
      toast.success(common('deleted'));
      setToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : common('failed'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus />
          {t('addRoot')}
        </Button>
      </div>

      <Card variant="muted">
        <CardContent className="pt-5">
          {flat.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              {t('empty')}
            </p>
          ) : (
            <ul className="divide-y">
              {flat.map((item) => {
                const node = findNode(categories, item.id);
                if (!node) return null;
                const Icon = categoryIcon(item.icon);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 py-2"
                    style={{ paddingInlineStart: `${item.depth * 1.25}rem` }}
                  >
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', toneForValue(node.color ?? node.name))}>
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      {!node.is_active ? (
                        <span className="text-2xs text-muted-foreground">{t('inactive')}</span>
                      ) : null}
                    </div>
                    {item.depth === 0 ? (
                      <Button size="sm" variant="ghost" onClick={() => openCreate(node)}>
                        <Plus />
                        {t('addChild')}
                      </Button>
                    ) : null}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => openEdit(node)}
                      aria-label={common('edit')}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setToDelete(node)}
                      aria-label={common('delete')}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? t('editTitle') : t('createTitle')}</DialogTitle>
            <DialogDescription>{t('formHint')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">{t('name')}</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={128}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-parent">{t('parent')}</Label>
              <Select
                value={form.parent_id ?? NONE}
                onValueChange={(value) =>
                  setForm({ ...form, parent_id: value === NONE ? null : value })
                }
              >
                <SelectTrigger id="cat-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    <span className="flex items-center gap-1.5">
                      <Folder className="size-3.5" />
                      {t('noParent')}
                    </span>
                  </SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat-icon">{t('icon')}</Label>
                <Select
                  value={form.icon ?? NONE}
                  onValueChange={(value) => setForm({ ...form, icon: value === NONE ? null : value })}
                >
                  <SelectTrigger id="cat-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('noIcon')}</SelectItem>
                    {Object.keys(CATEGORY_ICONS).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-color">{t('color')}</Label>
                <Select
                  value={form.color ?? NONE}
                  onValueChange={(value) => setForm({ ...form, color: value === NONE ? null : value })}
                >
                  <SelectTrigger id="cat-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('noColor')}</SelectItem>
                    {COLOR_TONES.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">{t('sortOrder')}</Label>
              <Input
                id="cat-sort"
                type="number"
                className="no-spinners w-32"
                value={form.sort_order}
                onChange={(event) =>
                  setForm({ ...form, sort_order: Number.parseInt(event.target.value, 10) || 0 })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">{t('descriptionField')}</Label>
              <Textarea
                id="cat-desc"
                value={form.description ?? ''}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
              />
            </div>

            <Label htmlFor="cat-active" className="flex cursor-pointer items-center gap-2">
              <Checkbox
                id="cat-active"
                checked={form.is_active}
                onCheckedChange={(value) => setForm({ ...form, is_active: value === true })}
              />
              {t('activeField')}
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {common('cancel')}
            </Button>
            <Button onClick={save} loading={saving}>
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
