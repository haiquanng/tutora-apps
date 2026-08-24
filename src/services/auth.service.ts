import { authHeader, BACKEND_URL, USER_LOCAL_STORAGE_KEY, WEB_URL } from './api.service';

export interface AuthUser {
  id?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

/** User kèm token — chỉ có ở nhánh đọc localStorage (dev local, cùng origin). */
type LocalUser = AuthUser & { accessToken?: string; refreshToken?: string };

const readLocalFallback = (): LocalUser | null => {
  try {
    const raw = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalUser;
    return parsed.accessToken || parsed.email ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Web chính bàn giao phiên qua fragment (#accessToken=...&refreshToken=...) vì
 */
export const consumeSessionFromUrl = (): boolean => {
  if (!window.location.hash) return false;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = params.get('accessToken');
  if (!accessToken) return false;

  const existing = readLocalFallback() ?? {};
  localStorage.setItem(
    USER_LOCAL_STORAGE_KEY,
    JSON.stringify({ ...existing, accessToken, refreshToken: params.get('refreshToken') ?? undefined }),
  );

  // replaceState: xoá fragment mà không thêm entry mới vào history.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return true;
};

/**
 * Dùng /api/users/profile (endpoint CÓ THẬT)
 */
export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const local = readLocalFallback();

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...authHeader(),
      },
    });
    // 401/404 -> chưa đăng nhập hoặc BE chưa sẵn sàng; đừng chặn UI.
    if (!response.ok) return local;

    const body = await response.json();
    // BE .NET bọc payload trong { content: ... } ở hầu hết endpoint.
    const raw = (body?.content ?? body) as Record<string, unknown> | null;
    if (!raw) return local;

    return {
      id: (raw.userid ?? raw.userId) as string | undefined,
      fullName: (raw.fullname ?? raw.fullName) as string | undefined,
      email: raw.email as string | undefined,
      avatarUrl: (raw.avatarurl ?? raw.avatarUrl) as string | undefined,
      role: raw.role as string | undefined,
    };
  } catch {
    return local;
  }
};

/** Chuyển sang trang đăng nhập của web chính, xong quay lại đúng chỗ đang đứng. */
export const redirectToLogin = () => {
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${WEB_URL}/login?returnUrl=${returnUrl}`;
};

/**
 * Đề bài người dùng đã gõ trước khi bị yêu cầu đăng nhập.
 * Giữ lại để login xong quay về là gửi tiếp được, không phải gõ lại (như GPT/Claude).
 */
const PENDING_KEY = 'TUTORA_homework_pending';

export interface PendingPrompt {
  text?: string;
  imageDataUrl?: string;
}

export const savePendingPrompt = (prompt: PendingPrompt) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(prompt));
  } catch {
    /* ảnh base64 có thể vượt hạn mức sessionStorage -> bỏ qua, không chặn login */
  }
};

/** Lấy ra và xoá luôn — chỉ dùng đúng một lần. */
export const takePendingPrompt = (): PendingPrompt | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingPrompt) : null;
  } catch {
    return null;
  }
};

export const logout = async () => {
  const local = readLocalFallback();
  try {
    await fetch(`${BACKEND_URL}/api/tokens/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify({ refreshToken: local?.refreshToken ?? '' }),
    });
  } catch {
    /* best effort — vẫn xoá phía client dù server lỗi */
  }
  localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
  window.location.reload();
};

/** Ghi token, giữ nguyên field cũ. */
const saveSession = (accessToken: string, refreshToken?: string) => {
  const existing = readLocalFallback() ?? {};
  localStorage.setItem(USER_LOCAL_STORAGE_KEY, JSON.stringify({ ...existing, accessToken, refreshToken }));
};

export interface LoginOutcome {
  user?: AuthUser | null;
  /** Chưa xác thực SĐT thì BE không cấp token. */
  requiresPhoneVerification?: boolean;
  phone?: string;
}

/** Ném thẳng message tiếng Việt của BE cho modal hiện. */
const postAuth = async (path: string, body: unknown): Promise<Record<string, unknown>> => {
  const response = await fetch(`${BACKEND_URL}/api/auth/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    const message = (payload.message ?? payload.errorMessage) as string | undefined;
    throw new Error(message || 'Đăng nhập thất bại. Bạn kiểm tra lại thông tin nhé.');
  }

  return payload;
};

/** Đăng nhập bằng email, SĐT hoặc tên đăng nhập. */
export const loginWithPassword = async (emailOrPhone: string, password: string): Promise<LoginOutcome> => {
  const payload = await postAuth('login', { emailOrPhone, password });
  const content = (payload.content ?? {}) as Record<string, unknown>;

  // Cờ này đi kèm 200, không phải lỗi.
  if (content.requiresPhoneVerification) {
    return { requiresPhoneVerification: true, phone: content.phone as string | undefined };
  }

  const token = content.token as string | undefined;
  if (!token) throw new Error('Máy chủ không trả về phiên đăng nhập. Bạn thử lại nhé.');

  saveSession(token, content.refreshToken as string | undefined);
  return { user: await fetchCurrentUser() };
};

/** Đăng nhập Google — /auth/google trả object thô, không bọc content. */
export const loginWithGoogle = async (idToken: string): Promise<LoginOutcome> => {
  const payload = await postAuth('google', { idToken });

  const accessToken = payload.accessToken as string | undefined;
  if (accessToken) {
    saveSession(accessToken, payload.refreshToken as string | undefined);
    return { user: await fetchCurrentUser() };
  }

  if (payload.requiresRoleSelection || payload.requiresPhoneInput) {
    // Chọn vai trò + OTP chỉ web chính có.
    throw new Error('Tài khoản Google này chưa hoàn tất đăng ký. Bạn hoàn tất ở trang chủ Tutora rồi quay lại nhé.');
  }

  throw new Error((payload.message as string) || 'Đăng nhập Google thất bại.');
};

/** Đăng ký ở web chính, mở tab mới. */
export const openRegisterPage = () => {
  window.open(`${WEB_URL}/register`, '_blank', 'noopener');
};

export const openForgotPasswordPage = () => {
  window.open(`${WEB_URL}/login`, '_blank', 'noopener');
};
