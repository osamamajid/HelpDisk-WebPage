/** Shared HTTP plumbing for both the browser client and the server client. */

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Object serialized into a query string; array values repeat their key. */
  query?: Record<string, unknown>;
  /** JSON body. Mutually exclusive with `form`. */
  json?: unknown;
  /** Multipart body (uploads, form-flag endpoints). */
  form?: FormData;
  headers?: Record<string, string>;
  cache?: RequestCache;
  signal?: AbortSignal;
}

/** Lowest level transport: resolve a path (no prefix) into a Response. */
export type Fetcher = (path: string, init: RequestInit) => Promise<Response>;

/**
 * Append `query` entries to `path`, repeating keys for array values so FastAPI
 * `Optional[list[UUID]] = Query(None)` parameters are parsed correctly.
 */
export function withQuery(path: string, query?: Record<string, unknown>): string {
  if (!query) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === '') continue;
        search.append(key, String(item));
      }
      continue;
    }
    if (typeof value === 'boolean') {
      search.set(key, value ? 'true' : 'false');
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** FastAPI reports failures as `{ detail: ... }`; normalise to a readable string. */
export function extractMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // Pydantic validation error list.
    return detail
      .map((item) => {
        if (!item || typeof item !== 'object') return String(item);
        const loc = (item as { loc?: unknown[] }).loc;
        const msg = (item as { msg?: string }).msg;
        const field = Array.isArray(loc) ? loc.slice(1).join('.') : '';
        return field ? `${field}: ${msg ?? ''}`.trim() : (msg ?? String(item));
      })
      .join('\n');
  }
  if (detail && typeof detail === 'object') {
    const obj = detail as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    if (typeof obj.message === 'string') return obj.message;
  }
  return 'Request failed';
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Execute a request and return the parsed JSON body.
 * Returns `null` for 204/empty responses and throws `ApiError` on non-2xx.
 */
export async function execute<T>(
  fetcher: Fetcher,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', query, json, form, headers = {}, cache, signal } = options;

  const init: RequestInit = { method, headers: { ...headers }, cache, signal };

  if (form) {
    // Let the browser set the multipart boundary.
    init.body = form;
  } else if (json !== undefined) {
    init.headers = { 'Content-Type': 'application/json', ...init.headers };
    init.body = JSON.stringify(json);
  }

  const response = await fetcher(withQuery(path, query), init);

  if (response.status === 204) return null as T;

  const body = await readBody(response);

  if (!response.ok) {
    const payload = (body ?? {}) as { detail?: unknown };
    throw new ApiError(
      response.status,
      payload.detail ?? body,
      extractMessage(payload.detail ?? body),
    );
  }

  return body as T;
}
