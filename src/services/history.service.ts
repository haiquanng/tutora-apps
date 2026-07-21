import type { HistoryItem } from '../types/solve';

/** Lịch sử hỏi bài lưu localStorage (chờ BE có endpoint riêng). */
const HISTORY_KEY = 'TUTORA_homework_history';
const MAX_ITEMS = 100;

export const getHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as HistoryItem[];
    // Bỏ bản ghi theo schema CŨ (không có turns[]) — mở lại chỉ ra màn hình trống,
    // và trước đây còn gây crash ở loadFromHistory.
    return items.filter((h) => Array.isArray(h.turns) && h.turns.length > 0);
  } catch {
    return [];
  }
};

/** Lấy 1 bài theo id — dùng khi mở thẳng URL /c/:id. */
export const getHistoryItem = (id: string): HistoryItem | undefined => getHistory().find((h) => h.id === id);

export const saveHistoryItem = (item: HistoryItem): HistoryItem[] => {
  // Cùng session -> cập nhật tại chỗ thay vì thêm bản ghi trùng.
  const rest = getHistory().filter((h) => h.id !== item.id);
  const next = [item, ...rest].slice(0, MAX_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
};

export const removeHistoryItem = (id: string): HistoryItem[] => {
  const next = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
};

export const clearHistory = (): HistoryItem[] => {
  localStorage.removeItem(HISTORY_KEY);
  return [];
};
