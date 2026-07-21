/**
 * Xác thực dùng chung tài khoản với web chính Tutora.
 *
 * QUAN TRỌNG — apps.tutora.vn KHÁC origin với web chính nên localStorage KHÔNG
 * dùng chung được. App này cũng KHÔNG có trang login riêng: bấm Đăng nhập ->
 * sang web chính -> quay lại theo ?returnUrl.
 *
 * CÁCH HOẠT ĐỘNG HIỆN TẠI (tạm thời):
 *   Web chính đính token vào fragment của returnUrl, app này đọc bằng
 *   consumeSessionFromUrl() rồi xoá khỏi URL ngay. BE xác thực bằng Bearer.
 *
 * TRẠNG THÁI BE (đã kiểm tra Tutora-Backend/Program.cs):
 *   - JWT thuần Bearer; JwtBearerEvents chỉ đọc token từ query string cho SignalR,
 *     CHƯA đọc cookie -> SSO qua cookie chưa hoạt động.
 *   - Không có /auth/me -> dùng GET /api/users/profile.
 *   - Không có /auth/logout -> dùng POST /api/tokens/revoke.
 *   - CORS đã thêm localhost:5180 + apps.tutora.vn.
 *
 * TODO(BE) để bỏ hẳn việc truyền token qua URL:
 *   1. set token vào cookie HttpOnly, Domain=.tutora.vn, SameSite=Lax
 *   2. JwtBearerEvents.OnMessageReceived đọc thêm token từ cookie đó
 *   Khi xong: xoá consumeSessionFromUrl + appendSessionToReturnUrl bên Tutora-FE.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5166';
const WEB_URL = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';

/** Key Tutora-FE đang dùng — chỉ đọc được khi chạy cùng origin (dev local). */
const USER_LOCAL_STORAGE_KEY = 'TUTORA_user_data';

export interface AuthUser {
  id?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

/** User kèm token — chỉ có ở nhánh đọc localStorage (dev local, cùng origin). */
type LocalUser = AuthUser & { accessToken?: string; refreshToken?: string };

/**
 * Dev local (cùng origin với Tutora-FE) thì vẫn lấy được user + token từ localStorage.
 * Trên production khác origin, hàm này luôn trả null -> phải trông vào cookie.
 */
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
 * khác origin không dùng chung localStorage được. Đọc xong LƯU rồi XOÁ fragment
 * khỏi thanh địa chỉ ngay để token không nằm lại trong URL / lịch sử trình duyệt.
 *
 * Gọi trước mọi thứ khác lúc khởi động app.
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
 * Hỏi BE user hiện tại.
 *
 * Dùng /api/users/profile (endpoint CÓ THẬT) — không phải /auth/me, BE chưa có.
 * Gửi kèm cả cookie (credentials) lẫn Bearer:
 *  - Bearer: cách BE đang hoạt động hôm nay (JwtBearer đọc header Authorization).
 *  - credentials: để khi BE bật cookie .tutora.vn thì tự chạy, không phải sửa FE.
 */
export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const local = readLocalFallback();

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(local?.accessToken ? { Authorization: `Bearer ${local.accessToken}` } : {}),
      },
    });
    // 401/404 -> chưa đăng nhập hoặc BE chưa sẵn sàng; đừng chặn UI.
    if (!response.ok) return local;

    const body = await response.json();
    // BE .NET bọc payload trong { content: ... } ở hầu hết endpoint.
    return (body?.content ?? body) as AuthUser;
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
    // Endpoint thật là /api/tokens/revoke (KHÔNG phải /auth/logout) và cần
    // refreshToken trong body + Authorization.
    await fetch(`${BACKEND_URL}/api/tokens/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(local?.accessToken ? { Authorization: `Bearer ${local.accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: local?.refreshToken ?? '' }),
    });
  } catch {
    /* best effort — vẫn xoá phía client dù server lỗi */
  }
  localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
  window.location.reload();
};
