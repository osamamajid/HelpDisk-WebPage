'use client';

import { ChevronDown, FileUp, Info, UploadCloud } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { BrandRead, CategoryRead, FileUploadMeta, OSRead } from '@/lib/api/types';
import { flattenCategories } from '@/lib/category-tree';
import { ARCHITECTURES, LIMITS, UPLOAD_ACCEPT, UPLOAD_EXTENSIONS } from '@/lib/constants';
import { formatBytes } from '@/lib/utils';

const NONE = '__none__';

interface UploadFormProps {
  categories: CategoryRead[];
  brands: BrandRead[];
  operatingSystems: OSRead[];
}

interface FormState {
  name: string;
  description: string;
  category_id: string | null;
  brand_id: string | null;
  model: string;
  version: string;
  architectures: string[];
  operating_systems: string[];
  tags: string;
  is_favorite: boolean;
}

const INITIAL: FormState = {
  name: '',
  description: '',
  category_id: null,
  brand_id: null,
  model: '',
  version: '',
  architectures: [],
  operating_systems: [],
  tags: '',
  is_favorite: false,
};

/**
 * Registers a new driver/utility. The binary and its metadata go up in a single
 * multipart POST (the `metadata` field is a JSON string the backend parses), so
 * there is no two-phase create/attach step to get wrong.
 */
export function UploadForm({ categories, brands, operatingSystems }: UploadFormProps) {
  const t = useTranslations('admin.upload');
  const common = useTranslations('admin.common');
  const router = useRouter();

  const flat = React.useMemo(() => flattenCategories(categories), [categories]);

  const [file, setFile] = React.useState<File | null>(null);
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [pending, setPending] = React.useState(false);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setFile(picked);
    // Prefill the display name from the filename until the admin types one.
    if (picked && !form.name) {
      setForm((prev) => ({ ...prev, name: picked.name.replace(/\.[^.]+$/, '') }));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error(t('noFileSelected'));
      return;
    }
    if (!form.name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    const meta: FileUploadMeta = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id,
      brand_id: form.brand_id,
      model: form.model.trim() || null,
      version: form.version.trim() || null,
      architectures: form.architectures,
      operating_systems: form.operating_systems,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      is_favorite: form.is_favorite,
    };

    setPending(true);
    try {
      const created = await api.files.create(file, meta);
      toast.success(t('success', { name: created.name }));
      setFile(null);
      setForm(INITIAL);
      router.push('/admin/files');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-0.5 border-b pb-4">
        <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <CardContent className="space-y-3 pt-5">
            <Label htmlFor="file" className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center transition-colors hover:bg-muted/50">
              <UploadCloud className="size-6 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">
                {file ? file.name : t('chooseFile')}
              </span>
              <span className="text-xs text-muted-foreground bidi-safe" dir="ltr">
                {file ? formatBytes(file.size) : t('accept', { ext: UPLOAD_EXTENSIONS.join(', ') })}
              </span>
            </Label>
            <Input
              id="file"
              type="file"
              className="sr-only"
              accept={UPLOAD_ACCEPT}
              onChange={onPick}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="u-name">{t('nameLabel')}</Label>
                <Input
                  id="u-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  maxLength={LIMITS.nameMax}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-category">{t('category')}</Label>
                <Select
                  value={form.category_id ?? NONE}
                  onValueChange={(value) => setForm({ ...form, category_id: value === NONE ? null : value })}
                >
                  <SelectTrigger id="u-category">
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
            </div>

            {/* Everything optional folds away so the primary fields stay calm. */}
            <details className="disclosure group surface p-3">
              <summary className="flex list-none items-center gap-1.5 text-sm font-medium">
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                {t('additionalDetails')}
              </summary>

              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="u-desc">{t('descriptionLabel')}</Label>
                  <Textarea
                    id="u-desc"
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    maxLength={LIMITS.descriptionMax}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="u-brand">{t('brand')}</Label>
                    <Select
                      value={form.brand_id ?? NONE}
                      onValueChange={(value) => setForm({ ...form, brand_id: value === NONE ? null : value })}
                    >
                      <SelectTrigger id="u-brand">
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
                  <div className="space-y-1.5">
                    <Label htmlFor="u-model">{t('model')}</Label>
                    <Input
                      id="u-model"
                      value={form.model}
                      onChange={(event) => setForm({ ...form, model: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="u-version">{t('version')}</Label>
                    <Input
                      id="u-version"
                      value={form.version}
                      onChange={(event) => setForm({ ...form, version: event.target.value })}
                      maxLength={LIMITS.versionMax}
                    />
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{t('architectures')}</legend>
                  <div className="flex flex-wrap gap-4">
                    {ARCHITECTURES.map((arch) => {
                      const checked = form.architectures.includes(arch);
                      return (
                        <Label key={arch} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setForm({
                                ...form,
                                architectures:
                                  value === true
                                    ? [...form.architectures, arch]
                                    : form.architectures.filter((a) => a !== arch),
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
                        const checked = form.operating_systems.includes(os.id);
                        return (
                          <Label key={os.id} className="flex cursor-pointer items-center gap-2 text-sm font-normal">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                setForm({
                                  ...form,
                                  operating_systems:
                                    value === true
                                      ? [...form.operating_systems, os.id]
                                      : form.operating_systems.filter((id) => id !== os.id),
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

                <div className="space-y-1.5">
                  <Label htmlFor="u-tags">{t('tags')}</Label>
                  <Input
                    id="u-tags"
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    placeholder={t('tagsPlaceholder')}
                  />
                  <p className="flex items-center gap-1 text-2xs text-muted-foreground">
                    <Info className="size-3" aria-hidden />
                    {t('tagsHint')}
                  </p>
                </div>

                <Label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={form.is_favorite}
                    onCheckedChange={(value) => setForm({ ...form, is_favorite: value === true })}
                  />
                  {t('markFavorite')}
                </Label>
              </div>
            </details>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button type="submit" loading={pending}>
            <FileUp />
            {pending ? t('submitting') : t('submit')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/files')}>
            {common('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
