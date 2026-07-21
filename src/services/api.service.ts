/** Nguồn URL DUY NHẤT cho cả app — sửa ở đây, không khai lại nơi khác. */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5166';
export const WEB_URL = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';
export const AI_URL = import.meta.env.PROD ? import.meta.env.VITE_AI_URL || '' : '';

const BASE = `${BACKEND_URL}/api`;

export class ApiError extends Error {
  status: number;
  unauthorized: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.unauthorized = status === 401 || status === 403;
  }
}

const unwrap = <T>(body: unknown): T => {
  const b = body as { content?: T } | T;
  return (b as { content?: T })?.content ?? (b as T);
};

interface RequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  errorMessages?: Record<number, string>;
  signal?: AbortSignal;
}

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const url = `${BASE}${path}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== null && v !== undefined) qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
};

const request = async <T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = { method, credentials: 'include', headers, signal: opts.signal };

  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), init);

  if (!res.ok) {
    throw new ApiError(res.status, opts.errorMessages?.[res.status] ?? `Yêu cầu thất bại (${res.status}).`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? unwrap<T>(JSON.parse(text)) : (undefined as T);
};

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
