/**
 * Quota MOCK (localStorage) — chờ Tutora-Backend implement.
 *
 * Luật đăng ký:
 * - Không có lớp đang học: 10 câu / tuần.
 * - Mỗi lớp đang học: 200 câu / tháng, CỘNG DỒN nhiều lớp (tự đặt lẫn phụ huynh đặt).
 * Khi có lớp active thì dùng hạn mức tháng, bỏ hạn mức tuần.
 *
 * TODO(BE): thay bằng GET /api/me/ai-quota, POST khi consume.
 */
const QUOTA_KEY = 'TUTORA_homework_quota';

const FREE_WEEKLY_LIMIT = 10;
const PER_CLASS_MONTHLY_LIMIT = 200;

export interface QuotaState {
  used: number;
  /** Số lớp đang học — mock, sau lấy từ BE. */
  activeClasses: number;
  /** Mốc bắt đầu chu kỳ hiện tại (epoch ms) để tự reset. */
  periodStart: number;
}

export interface QuotaView extends QuotaState {
  limit: number;
  remaining: number;
  /** 'week' khi chưa có lớp, 'month' khi đã có lớp active. */
  period: 'week' | 'month';
  isExhausted: boolean;
}

const defaultState = (): QuotaState => ({ used: 0, activeClasses: 0, periodStart: Date.now() });

const readState = (): QuotaState => {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    return raw ? { ...defaultState(), ...(JSON.parse(raw) as QuotaState) } : defaultState();
  } catch {
    return defaultState();
  }
};

const writeState = (state: QuotaState) => localStorage.setItem(QUOTA_KEY, JSON.stringify(state));

const periodMs = (period: 'week' | 'month') => (period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000);

export const getQuota = (): QuotaView => {
  let state = readState();
  const period: 'week' | 'month' = state.activeClasses > 0 ? 'month' : 'week';

  // Hết chu kỳ -> reset bộ đếm.
  if (Date.now() - state.periodStart > periodMs(period)) {
    state = { ...state, used: 0, periodStart: Date.now() };
    writeState(state);
  }

  const limit = state.activeClasses > 0 ? state.activeClasses * PER_CLASS_MONTHLY_LIMIT : FREE_WEEKLY_LIMIT;
  const remaining = Math.max(0, limit - state.used);

  return { ...state, limit, remaining, period, isExhausted: remaining <= 0 };
};

export const consumeQuota = (): QuotaView => {
  const state = readState();
  writeState({ ...state, used: state.used + 1 });
  return getQuota();
};

/** Chỉ dùng cho demo/dev: giả lập số lớp đang học để xem UI đổi hạn mức. */
export const setActiveClasses = (activeClasses: number): QuotaView => {
  writeState({ ...readState(), activeClasses });
  return getQuota();
};
