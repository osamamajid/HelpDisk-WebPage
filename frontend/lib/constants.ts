/** Route names, cookie keys and pick-lists shared across the app. */

export const API_PREFIX = '/api/v1';

/**
 * Cookies owned by the Next.js layer. The backend issues its own
 * `access_token` cookie, but cross-origin cookies are unreliable between
 * :3000 and :8000, so the proxy stores the tokens on the first-party origin
 * and forwards them as an `Authorization: Bearer` header instead.
 */
export const COOKIES = {
  access: 'idrv_access',
  refresh: 'idrv_refresh',
  locale: 'idrv_locale',
} as const;

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

/** Sort values accepted by GET /files?order=. */
export const SORT_ORDERS = ['recent', 'downloads', 'name'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const PER_PAGE_OPTIONS = [12, 24, 50, 100] as const;
export const DEFAULT_PER_PAGE = 24;

/** Must mirror app/core/constants.py DEFAULT_ARCHITECTURES. */
export const ARCHITECTURES = ['32-bit', '64-bit', 'ARM64'] as const;

/** Upload accept list, mirrors ALLOWED_EXTENSIONS in .env. */
export const UPLOAD_EXTENSIONS = [
  '.exe', '.msi', '.zip', '.rar', '.7z', '.iso',
  '.pdf', '.txt', '.img', '.cab', '.bin', '.msu', '.msp',
];
export const UPLOAD_ACCEPT = UPLOAD_EXTENSIONS.join(',');
export const DEFAULT_MAX_UPLOAD_MB = 2048;

export type NavItem = {
  href: string;
  key: string;
  /** Exact-match highlight instead of prefix match. */
  exact?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', key: 'home', exact: true },
  { href: '/search', key: 'search' },
  { href: '/favorites', key: 'favorites' },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard', key: 'dashboard' },
  { href: '/admin/files', key: 'files' },
  { href: '/admin/upload', key: 'upload' },
  { href: '/admin/categories', key: 'categories' },
  { href: '/admin/brands', key: 'brands' },
  { href: '/admin/operating-systems', key: 'operatingSystems' },
  { href: '/admin/tags', key: 'tags' },
];

/** Admin sections whose routes require a session. */
export const ADMIN_PROTECTED_PATHS = ADMIN_NAV.map((item) => item.href);

export const LOGIN_PATH = '/admin/login';

/** Longest string the backend accepts, reused for client-side validation. */
export const LIMITS = {
  nameMax: 255,
  usernameMax: 64,
  categoryNameMax: 128,
  tagNameMax: 64,
  versionMax: 64,
  descriptionMax: 5000,
} as const;
