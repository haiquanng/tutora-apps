export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5166';
export const WEB_URL = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';

const BASE = `${BACKEND_URL}/api`;

export const USER_LOCAL_STORAGE_KEY = 'TUTORA_user_data';

export const getAccessToken = (): string | undefined => {
  try {
    const raw = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken : undefined;
  } catch {
    return undefined;
  }
};

export const authHeader = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getRefreshToken = (): string | undefined => {
  try {
    const raw = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { refreshToken?: string }).refreshToken : undefined;
  } catch {
    return undefined;
  }
};

const saveTokens = (accessToken: string, refreshToken?: string) => {
  const raw = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
  const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  localStorage.setItem(USER_LOCAL_STORAGE_KEY, JSON.stringify({ ...existing, accessToken, refreshToken }));
};

export const clearSession = () => localStorage.removeItem(USER_LOCAL_STORAGE_KEY);

/** Ai đó cần biết phiên vừa chết để đưa người dùng về trạng thái chưa đăng nhập. */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export const setSessionExpiredHandler = (fn: SessionExpiredHandler | null) => {
  onSessionExpired = fn;
};

let refreshInFlight: Promise<string | null> | null = null;

const doRefresh = async (): Promise<string | null> => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  // BE bắt buộc CẢ HAI (TokenController.Refresh trả 400 nếu thiếu 1 trong 2).
  if (!accessToken || !refreshToken) return null;

  try {
    const res = await fetch(`${BASE}/tokens/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { content?: { token?: string; refreshToken?: string } };
    const token = body.content?.token;
    if (!token) return null;

    saveTokens(token, body.content?.refreshToken);
    return token;
  } catch {
    // Mạng chớp -> KHÔNG xoá phiên, để lần gọi sau thử lại.
    return null;
  }
};

export const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

/** Refresh hỏng -> phiên chết: dọn storage và báo cho AuthProvider. */
export const handleSessionExpired = () => {
  clearSession();
  onSessionExpired?.();
};

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
  const b = body as { content?: T; data?: T } | T;
  if (b && typeof b === 'object') {
    if ('content' in b && (b as { content?: T }).content !== undefined) return (b as { content: T }).content;
    if ('data' in b && (b as { data?: T }).data !== undefined) return (b as { data: T }).data;
  }
  return b as T;
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

/**
 * Thông báo lỗi cho người dùng cuối — TUYỆT ĐỐI không in mã HTTP ra màn hình.
 * Học sinh không hiểu 401/404 nghĩa là gì; nói thẳng cần làm gì tiếp.
 */
const defaultErrorMessage = (status: number): string => {
  if (status === 401 || status === 403) return 'Bạn cần đăng nhập để xem nội dung này.';
  if (status === 404) return 'Không tìm thấy nội dung này.';
  if (status === 408 || status === 504) return 'Mạng chậm nên yêu cầu bị quá hạn. Bạn thử lại nhé.';
  if (status === 429) return 'Bạn thao tác hơi nhanh. Chờ một chút rồi thử lại nhé.';
  if (status >= 500) return 'Hệ thống đang bận. Bạn thử lại sau ít phút nhé.';
  return 'Có lỗi xảy ra. Bạn thử lại nhé.';
};

const request = async <T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> => {
  const url = buildUrl(path, opts.query);
  const body = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;

  const fire = (token?: string) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    // token truyền vào = vừa refresh xong; không có thì lấy từ storage.
    const auth = token ? { Authorization: `Bearer ${token}` } : authHeader();
    Object.assign(headers, auth);
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    return fetch(url, { method, credentials: 'include', headers, body, signal: opts.signal });
  };

  let res = await fire();

  // 401 -> access token hết hạn (sống 1h).
  // 403 KHÔNG retry: đó là thiếu quyền, refresh không cứu được.
  if (res.status === 401) {
    const token = await refreshAccessToken();
    if (token) {
      res = await fire(token);
      if (res.status === 401) handleSessionExpired();
    } else {
      handleSessionExpired();
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, opts.errorMessages?.[res.status] ?? defaultErrorMessage(res.status));
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? unwrap<T>(JSON.parse(text)) : (undefined as T);
};

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>('PATCH', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
