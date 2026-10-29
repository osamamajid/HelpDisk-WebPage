'use client';

import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/browser';
import type { BrandRead, OSRead, TagRead } from '@/lib/api/types';
import { ApiError } from '@/lib/api/http';
import { formatDate } from '@/lib/utils';

type TaxonomyItem = BrandRead | OSRead | TagRead;
type EntityKey = 'brands' | 'operatingSystems' | 'tags';

interface TaxonomyManagerProps {
  entityKey: EntityKey;
  initial: TaxonomyItem[];
  title: string;
  description: string;
}

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Name-only taxonomy CRUD shared by brands, operating systems and tags. The
 * three resources expose identical create/update/remove signatures, so one
 * component drives all of them through `api[entityKey]`.
 */
export function TaxonomyManager({ entityKey, initial, title, description }: TaxonomyManagerProps) {
  const t = useTranslations('admin.taxonomy');
  const [list, setList] = React.useState<TaxonomyItem[]>(initial);
  const [term, setTerm] = React.useState('');
  const [draft, setDraft] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<TaxonomyItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const filtered = React.useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((item) => item.name.toLowerCase().includes(needle));
  }, [list, term]);

  async function add() {
    const name = draft.trim();
    if (!name) {
      toast.error(t('nameRequired'));
      return;
    }
    setPending(true);
    try {
      const created = await api[entityKey].create(name);
      setList((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setDraft('');
      toast.success(t('created'));
    } catch (error) {
      toast.error(message(error, t('failed')));
    } finally {
      setPending(false);
    }
  }

  function startEdit(item: TaxonomyItem) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  async function saveEdit() {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) {
      toast.error(t('nameRequired'));
      return;
    }
    setPending(true);
    try {
      const updated = await api[entityKey].update(editingId, name);
      setList((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      toast.success(t('updated'));
    } catch (error) {
      toast.error(message(error, t('failed')));
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api[entityKey].remove(toDelete.id);
      setList((prev) => prev.filter((item) => item.id !== toDelete.id));
      toast.success(t('deleted'));
      setToDelete(null);
    } catch (error) {
      toast.error(message(error, t('failed')));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t('search')}
              className="ps-8 sm:w-56"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Plus className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && add()}
                placeholder={t('namePlaceholder')}
                className="ps-8"
                aria-label={t('name')}
              />
            </div>
            <Button onClick={add} loading={pending}>
              {t('addNew')}
            </Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={X}
              title={list.length === 0 ? t('empty') : t('noResults')}
              description={list.length === 0 ? t('emptyHint') : undefined}
            />
          ) : (
            <ul className="divide-y">
              {filtered.map((item) => {
                const editing = editingId === item.id;
                return (
                  <li key={item.id} className="flex items-center gap-2 py-2">
                    {editing ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') saveEdit();
                            if (event.key === 'Escape') setEditingId(null);
                          }}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={saveEdit} loading={pending}>
                          {t('save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          aria-label={t('cancel')}
                        >
                          <X />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="hidden text-xs text-muted-foreground bidi-safe sm:inline" dir="ltr">
                          {formatDate(item.created_at)}
                        </span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          aria-label={t('rename')}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setToDelete(item)}
                          aria-label={t('delete')}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('confirmTitle')}
        description={t('confirmBody', { name: toDelete?.name ?? '' })}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
