/** TypeScript mirrors of the FastAPI schemas (app/schemas/*). */

export type UUID = string;

export interface TagRead {
  id: UUID;
  name: string;
  slug: string;
  created_at: string;
}

export interface OSRead {
  id: UUID;
  name: string;
  slug: string;
  created_at: string;
}

export interface BrandRead {
  id: UUID;
  name: string;
  slug: string;
  created_at: string;
}

export interface CategoryRead {
  id: UUID;
  name: string;
  slug: string;
  parent_id: UUID | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  children: CategoryRead[];
}

export interface CategoryCreate {
  name: string;
  parent_id?: UUID | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export type CategoryUpdate = Partial<CategoryCreate>;

/** Full record returned by detail / mutation endpoints. */
export interface FileRead {
  id: UUID;
  name: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  extension: string;
  description: string | null;
  category: CategoryRead | null;
  brand: BrandRead | null;
  model: string | null;
  version: string | null;
  architectures: string[];
  operating_systems: OSRead[];
  tags: TagRead[];
  is_favorite: boolean;
  download_count: number;
  last_downloaded_at: string | null;
  uploaded_by: UUID | null;
  created_at: string;
  updated_at: string;
}

/** Compact view used by every list and search response. */
export interface FileListItem {
  id: UUID;
  name: string;
  original_filename: string;
  file_size: number;
  extension: string;
  description: string | null;
  category: CategoryRead | null;
  brand: BrandRead | null;
  model: string | null;
  version: string | null;
  architectures: string[];
  operating_systems: OSRead[];
  tags: TagRead[];
  is_favorite: boolean;
  download_count: number;
  last_downloaded_at: string | null;
  created_at: string;
}

/** Fields accepted by PUT /files/{id}. */
export interface FileUpdate {
  name?: string | null;
  description?: string | null;
  category_id?: UUID | null;
  brand_id?: UUID | null;
  model?: string | null;
  version?: string | null;
  architectures?: string[] | null;
  operating_systems?: UUID[] | null;
  tags?: string[] | null;
  is_favorite?: boolean | null;
}

/** JSON blob sent as the `metadata` form field on POST /files. */
export interface FileUploadMeta {
  name: string;
  description?: string | null;
  category_id?: UUID | null;
  brand_id?: UUID | null;
  model?: string | null;
  version?: string | null;
  architectures: string[];
  operating_systems: UUID[];
  tags: string[];
  is_favorite: boolean;
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

/** GET /files -> { success, data, meta }. */
export interface FileListResponse {
  success: boolean;
  data: FileListItem[];
  meta: PageMeta;
}

/** GET /files/recent | /trending | /favorites -> { success, data }. */
export interface FileCollectionResponse {
  success: boolean;
  data: FileListItem[];
}

/** ResponseBase[T] wrapper used by detail and mutation endpoints. */
export interface Envelope<T> {
  success: boolean;
  data: T | null;
  message?: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_in: number;
}

export interface UserRead {
  id: UUID;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryStat {
  id: string;
  name: string;
  file_count: number;
}

export interface DashboardStatsFull {
  total_files: number;
  total_downloads: number;
  total_categories: number;
  storage_used_bytes: number;
  favorite_files: number;
  recent_files: number;
  top_categories: CategoryStat[];
  top_brands: CategoryStat[];
  architecture_breakdown: Record<string, number>;
  os_breakdown: CategoryStat[];
}

export interface FileQuery {
  q?: string;
  category_id?: string[];
  brand_id?: string[];
  os_id?: string[];
  architectures?: string[];
  is_favorite?: boolean;
  order?: string;
  page?: number;
  per_page?: number;
}
