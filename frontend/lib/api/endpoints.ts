/**
 * Typed API surface for the IT Driver Library backend.
 *
 * Built as a factory over a `Fetcher` so the exact same call sites work from
 * server components (see lib/api/server.ts) and from the browser
 * (see lib/api/browser.ts).
 */
import { execute, type Fetcher } from './http';
import type {
  BrandRead,
  CategoryCreate,
  CategoryRead,
  CategoryUpdate,
  DashboardStatsFull,
  Envelope,
  FileCollectionResponse,
  FileListItem,
  FileListResponse,
  FileQuery,
  FileRead,
  FileUpdate,
  FileUploadMeta,
  OSRead,
  TagRead,
  Token,
  UserRead,
} from './types';

export interface MutationResult {
  success: boolean;
  message?: string;
}

export function createApi(fetcher: Fetcher, apiBase: string) {
  return {
    // ---------------------------------------------------------------------
    // Files - public
    // ---------------------------------------------------------------------
    files: {
      async list(query: FileQuery = {}): Promise<FileListResponse> {
        return execute<FileListResponse>(fetcher, '/files', { query: { ...query } });
      },

      async recent(limit = 12): Promise<FileListItem[]> {
        const res = await execute<FileCollectionResponse>(fetcher, '/files/recent', {
          query: { limit },
        });
        return res.data ?? [];
      },

      async trending(limit = 12): Promise<FileListItem[]> {
        const res = await execute<FileCollectionResponse>(fetcher, '/files/trending', {
          query: { limit },
        });
        return res.data ?? [];
      },

      async favorites(limit = 50): Promise<FileListItem[]> {
        const res = await execute<FileCollectionResponse>(fetcher, '/files/favorites', {
          query: { limit },
        });
        return res.data ?? [];
      },

      async get(id: string): Promise<FileRead> {
        const res = await execute<Envelope<FileRead>>(fetcher, `/files/${id}`);
        if (!res.data) throw new Error('File not found');
        return res.data;
      },

      /** Absolute, cookie-free link: the download route is public and streams. */
      downloadUrl(id: string): string {
        return `${apiBase}/api/v1/files/${id}/download`;
      },

      // ---------------------------------------------------------------------
      // Files - admin
      // ---------------------------------------------------------------------
      async create(file: File, meta: FileUploadMeta): Promise<FileRead> {
        const form = new FormData();
        form.append('file', file);
        form.append('metadata', JSON.stringify(meta));
        const res = await execute<Envelope<FileRead>>(fetcher, '/files', {
          method: 'POST',
          form,
        });
        if (!res.data) throw new Error('Upload failed');
        return res.data;
      },

      async update(id: string, payload: FileUpdate): Promise<FileRead> {
        const res = await execute<Envelope<FileRead>>(fetcher, `/files/${id}`, {
          method: 'PUT',
          json: payload,
        });
        if (!res.data) throw new Error('Update failed');
        return res.data;
      },

      async remove(id: string): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, `/files/${id}`, { method: 'DELETE' });
      },

      /** POST /files/{id}/favorite expects `flag` as a form field, not JSON. */
      async setFavorite(id: string, flag: boolean): Promise<FileRead> {
        const form = new FormData();
        form.append('flag', flag ? 'true' : 'false');
        const res = await execute<Envelope<FileRead>>(fetcher, `/files/${id}/favorite`, {
          method: 'POST',
          form,
        });
        if (!res.data) throw new Error('Favorite update failed');
        return res.data;
      },
    },

    // ---------------------------------------------------------------------
    // Categories
    // ---------------------------------------------------------------------
    categories: {
      list(includeChildren = true): Promise<CategoryRead[]> {
        return execute<CategoryRead[]>(fetcher, '/categories', {
          query: { include_children: includeChildren },
        });
      },
      get(id: string): Promise<CategoryRead> {
        return execute<CategoryRead>(fetcher, `/categories/${id}`);
      },
      create(payload: CategoryCreate): Promise<CategoryRead> {
        return execute<CategoryRead>(fetcher, '/categories', { method: 'POST', json: payload });
      },
      update(id: string, payload: CategoryUpdate): Promise<CategoryRead> {
        return execute<CategoryRead>(fetcher, `/categories/${id}`, {
          method: 'PUT',
          json: payload,
        });
      },
      remove(id: string): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, `/categories/${id}`, { method: 'DELETE' });
      },
    },

    // ---------------------------------------------------------------------
    // Brands / operating systems / tags
    // ---------------------------------------------------------------------
    brands: {
      list(): Promise<BrandRead[]> {
        return execute<BrandRead[]>(fetcher, '/brands');
      },
      create(name: string): Promise<BrandRead> {
        return execute<BrandRead>(fetcher, '/brands', { method: 'POST', json: { name } });
      },
      update(id: string, name: string): Promise<BrandRead> {
        return execute<BrandRead>(fetcher, `/brands/${id}`, { method: 'PUT', json: { name } });
      },
      remove(id: string): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, `/brands/${id}`, { method: 'DELETE' });
      },
    },

    operatingSystems: {
      list(): Promise<OSRead[]> {
        return execute<OSRead[]>(fetcher, '/operating-systems');
      },
      create(name: string): Promise<OSRead> {
        return execute<OSRead>(fetcher, '/operating-systems', { method: 'POST', json: { name } });
      },
      update(id: string, name: string): Promise<OSRead> {
        return execute<OSRead>(fetcher, `/operating-systems/${id}`, {
          method: 'PUT',
          json: { name },
        });
      },
      remove(id: string): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, `/operating-systems/${id}`, { method: 'DELETE' });
      },
    },

    tags: {
      list(): Promise<TagRead[]> {
        return execute<TagRead[]>(fetcher, '/tags');
      },
      create(name: string): Promise<TagRead> {
        return execute<TagRead>(fetcher, '/tags', { method: 'POST', json: { name } });
      },
      update(id: string, name: string): Promise<TagRead> {
        return execute<TagRead>(fetcher, `/tags/${id}`, { method: 'PUT', json: { name } });
      },
      remove(id: string): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, `/tags/${id}`, { method: 'DELETE' });
      },
    },

    // ---------------------------------------------------------------------
    // Auth
    // ---------------------------------------------------------------------
    auth: {
      login(username: string, password: string): Promise<Token> {
        return execute<Token>(fetcher, '/auth/login', {
          method: 'POST',
          json: { username, password },
        });
      },
      logout(): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, '/auth/logout', { method: 'POST' });
      },
      me(): Promise<UserRead> {
        return execute<UserRead>(fetcher, '/auth/me');
      },
      changePassword(old_password: string, new_password: string): Promise<MutationResult> {
        return execute<MutationResult>(fetcher, '/auth/change-password', {
          method: 'POST',
          json: { old_password, new_password },
        });
      },
    },

    dashboard: {
      stats(): Promise<DashboardStatsFull> {
        return execute<DashboardStatsFull>(fetcher, '/dashboard/stats');
      },
    },
  };
}

export type Api = ReturnType<typeof createApi>;
